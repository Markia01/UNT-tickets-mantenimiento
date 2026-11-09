# Contrato de la API — Sistema de tickets de mantenimiento UTN

Este documento es el acuerdo entre el frontend (`frontend/`) y el backend (`backend/`).
Los datos de prueba del frontend (`frontend/src/api/mocks/`) usan exactamente estas formas.
**Cada vista nueva agrega aquí sus endpoints.**

## Convenciones

- **URL base:** `VITE_API_URL` (por ejemplo `http://localhost:3000/api`). Las rutas de este documento son relativas a esa base.
- **Formato:** JSON en peticiones y respuestas (`Content-Type: application/json`).
- **Autenticación:** después de iniciar sesión, cada petición manda el token en el encabezado
  `Authorization: Bearer <token>`.
- **Fechas:** cadenas ISO 8601 en UTC (`"2026-11-08T15:30:00.000Z"`). El frontend las muestra en hora local.
- **Errores:** cualquier respuesta que no sea 2xx devuelve `{ "mensaje": "Texto para mostrar al usuario" }`, en español.

| Código | Cuándo |
| --- | --- |
| `400` | Datos inválidos |
| `401` | Sin token, token inválido o vencido (el frontend cierra la sesión y manda a `/login`). En `POST /auth/login`: correo o contraseña incorrectos |
| `403` | El rol del usuario no tiene permiso para el endpoint |
| `404` | El recurso no existe |
| `409` | La acción no aplica al estado actual (por ejemplo, asignar un ticket cerrado) |

**Roles:** `ADMIN`, `TECNICO`, `REPORTANTE`.

---

## Formas de datos

### Usuario

```json
{
  "id": "u1",
  "nombre": "Administración de Mantenimiento",
  "correo": "admin@utnay.edu.mx",
  "rol": "ADMIN",
  "activo": true
}
```

Nunca se devuelve la contraseña. `activo: false` = usuario desactivado (no puede iniciar sesión ni recibir tickets).

### Ticket

```js
{
  id,                 // string. Folio que se muestra como "#14"
  descripcion,        // string. Lo que escribió quien reporta
  estado,             // "ABIERTO" | "ASIGNADO" | "EN_PROCESO" | "CERRADO" | "CANCELADO"
  equipo: {          // ver "Equipo" (sin fallas ni ultimaFalla)
    id, tipo, descripcion,
    ubicacion: { edificio, aula },
    estado            // "ACTIVO" | "BAJA"
  },
  categoria: { id, nombre, horasObjetivo },   // horasObjetivo: número de horas para atenderlo
  reporta: { id, nombre, tipo },              // tipo: "Alumno" | "Docente" | "Personal"
  tecnico: { id, nombre } | null,             // null = sin técnico
  fotoReporte,        // string (URL) | null
  fotoCierre,         // string (URL) | null. Obligatoria al cerrar
  comentarioCierre,   // string | null
  motivoCancelacion,  // string | null. Solo si estado = "CANCELADO"
  creadoEn,           // fecha ISO
  venceEn,            // fecha ISO = creadoEn + categoria.horasObjetivo
  cerradoEn,          // fecha ISO | null. Cuándo dejó de estar activo: al cerrarse o al cancelarse
  historial: [        // en orden cronológico, el primero es "ABIERTO"
    {
      estado,                     // estado al que pasó el ticket
      usuario: { id, nombre },    // quién hizo el cambio
      tecnico: { id, nombre },    // solo en entradas "ASIGNADO": a quién se asignó
      comentario,                 // string | null (en "CANCELADO", el motivo)
      fecha
    }
  ],
  sumados: [ { id, nombre } ]   // personas que reportaron la misma falla
}
```

Ejemplo:

```json
{
  "id": "11",
  "descripcion": "El proyector no enciende; la luz de la lámpara parpadea en naranja.",
  "estado": "ASIGNADO",
  "equipo": {
    "id": "e2",
    "tipo": "Proyector",
    "descripcion": "Epson PowerLite X49",
    "ubicacion": { "edificio": "Edificio A", "aula": "Aula 1" }
  },
  "categoria": { "id": "c2", "nombre": "Audiovisual", "horasObjetivo": 24 },
  "reporta": { "id": "u7", "nombre": "[DOCENTE 2]", "tipo": "Docente" },
  "tecnico": { "id": "u4", "nombre": "[TÉCNICO 1]" },
  "fotoReporte": "/uploads/tickets/11-reporte.jpg",
  "fotoCierre": null,
  "comentarioCierre": null,
  "motivoCancelacion": null,
  "creadoEn": "2026-11-07T14:00:00.000Z",
  "venceEn": "2026-11-08T14:00:00.000Z",
  "cerradoEn": null,
  "historial": [
    {
      "estado": "ABIERTO",
      "usuario": { "id": "u7", "nombre": "[DOCENTE 2]" },
      "comentario": null,
      "fecha": "2026-11-07T14:00:00.000Z"
    },
    {
      "estado": "ASIGNADO",
      "usuario": { "id": "u1", "nombre": "Administración de Mantenimiento" },
      "tecnico": { "id": "u4", "nombre": "[TÉCNICO 1]" },
      "comentario": null,
      "fecha": "2026-11-07T16:00:00.000Z"
    }
  ],
  "sumados": []
}
```

### Equipo

```js
{
  id,
  tipo,               // uno de GET /catalogos → tiposEquipo
  descripcion,        // marca, modelo o número: "Dell OptiPlex 3080 · equipo 12"
  ubicacion: { edificio, aula },   // "Edificio B", "Aula 3" (aula = aula o espacio)
  estado,             // "ACTIVO" | "BAJA". Un equipo dado de baja conserva su historial
  fallas,             // fallas en la ventana de la regla de reemplazo (90 días)
  ultimaFalla         // fecha ISO del ticket no cancelado más reciente | null
}
```

`fallas` y `ultimaFalla` se calculan; solo vienen en las respuestas de `/equipos`.

### Reglas que comparten frontend y backend

- **Activo:** ticket que no está `CERRADO` ni `CANCELADO`.
- **Sin asignar:** ticket activo con `tecnico: null`.
- **Semáforo** (solo activos; lo calcula el frontend con `creadoEn`, `venceEn` y la hora actual):
  - *A tiempo:* queda más del 25 % del tiempo.
  - *Por vencer:* queda el 25 % o menos.
  - *Vencido:* ya pasó `venceEn`.
- **Fallas de un equipo:** tickets de ese equipo que no están `CANCELADO`.
- **Regla de reemplazo:** 4 o más fallas en los últimos 90 días. Los valores vienen de `GET /configuracion`.

---

## Endpoints

### `POST /auth/login`

Inicia sesión. **Rol:** público.

Petición:

```json
{ "correo": "admin@utnay.edu.mx", "contrasena": "demo1234" }
```

Respuesta `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": "u1",
    "nombre": "Administración de Mantenimiento",
    "correo": "admin@utnay.edu.mx",
    "rol": "ADMIN",
    "activo": true
  }
}
```

Respuesta `401`:

```json
{ "mensaje": "Correo o contraseña incorrectos" }
```

---

### `GET /admin/resumen`

Números y listas de la pantalla de Inicio del administrador. **Rol:** `ADMIN`.

| Campo | Descripción |
| --- | --- |
| `activos` | Total de tickets activos |
| `cerradosSemana` | Tickets cerrados desde el lunes de esta semana a las 00:00 (hora de Nayarit, `America/Mazatlan`) |
| `vencidos` | Tickets activos con semáforo Vencido |
| `sinAsignar` | Tickets activos sin técnico |
| `requierenAtencion` | Hasta 5 tickets activos (forma completa de Ticket) que están vencidos, por vencer o sin técnico. Orden: vencidos, luego por vencer, luego a tiempo sin técnico; dentro de cada grupo, por `venceEn` ascendente |
| `actividadReciente` | Los 5 cambios de estado más recientes de cualquier ticket (del `historial`), del más nuevo al más viejo. `texto` no incluye el folio: el frontend lo muestra como `#ticketId` |
| `cargaTecnicos` | Todos los técnicos con su número de tickets activos asignados, incluidos los que tienen 0 |
| `equiposMasFallas` | Los 3 equipos con más fallas reportadas en los últimos 90 días (por `creadoEn`), de mayor a menor. `equipo` tiene la misma forma que en Ticket |

Textos de `actividadReciente` según el estado del historial:

| Estado | Texto |
| --- | --- |
| `ABIERTO` | `creado por <quien reporta> · <tipo de equipo>, <aula>` |
| `ASIGNADO` | `asignado a <técnico>` |
| `EN_PROCESO` | `en proceso por <técnico>` |
| `CERRADO` | `cerrado por <técnico> con foto de evidencia` |
| `CANCELADO` | `cancelado por <admin>` |

Respuesta `200` (los tickets de `requierenAtencion` van completos; aquí se abrevian):

```json
{
  "activos": 8,
  "cerradosSemana": 3,
  "vencidos": 2,
  "sinAsignar": 3,
  "requierenAtencion": [
    { "id": "11", "estado": "ASIGNADO", "equipo": { "id": "e2", "tipo": "Proyector", "...": "..." }, "...": "..." },
    { "id": "14", "estado": "ABIERTO", "equipo": { "id": "e1", "tipo": "Aire acondicionado", "...": "..." }, "...": "..." }
  ],
  "actividadReciente": [
    { "fecha": "2026-11-08T19:12:00.000Z", "ticketId": "16", "texto": "en proceso por [TÉCNICO 1]" },
    { "fecha": "2026-11-08T19:05:00.000Z", "ticketId": "18", "texto": "cerrado por [TÉCNICO 2] con foto de evidencia" },
    { "fecha": "2026-11-08T18:10:00.000Z", "ticketId": "15", "texto": "creado por [ALUMNO 1] · Computadora, Laboratorio 1" }
  ],
  "cargaTecnicos": [
    { "tecnico": { "id": "u4", "nombre": "[TÉCNICO 1]" }, "activos": 2 },
    { "tecnico": { "id": "u2", "nombre": "[TÉCNICO 2]" }, "activos": 3 }
  ],
  "equiposMasFallas": [
    {
      "equipo": {
        "id": "e1",
        "tipo": "Aire acondicionado",
        "descripcion": "Minisplit Mirage 2 ton",
        "ubicacion": { "edificio": "Edificio B", "aula": "Aula 3" }
      },
      "fallas": 6
    },
    {
      "equipo": {
        "id": "e2",
        "tipo": "Proyector",
        "descripcion": "Epson PowerLite X49",
        "ubicacion": { "edificio": "Edificio A", "aula": "Aula 1" }
      },
      "fallas": 3
    }
  ]
}
```

Errores: `401` sin sesión, `403` si el rol no es `ADMIN`.

---

### `GET /tickets`

Lista paginada de tickets con filtros. **Rol:** `ADMIN`.

Parámetros de consulta (todos opcionales):

| Parámetro | Valores | Descripción |
| --- | --- | --- |
| `vista` | `todos` (por defecto) · `activos` · `cerrados` | `cerrados` incluye Cerrados y Cancelados |
| `q` | texto | Búsqueda por ID. Coincidencia exacta; se ignoran `#` y espacios (`#14` = `14`) |
| `desde` | `YYYY-MM-DD` | Desde ese día, incluido |
| `hasta` | `YYYY-MM-DD` | Hasta ese día, incluido |
| `edificio` | texto | Igual a `equipo.ubicacion.edificio` (valores de `GET /catalogos`) |
| `categoria` | id | `categoria.id` |
| `tiempo` | `A_TIEMPO` · `POR_VENCER` · `VENCIDO` | Semáforo. Solo devuelve tickets activos |
| `tecnico` | id de usuario · `sin` | `sin` = tickets sin técnico |
| `pagina` | entero ≥ 1 (por defecto 1) | Si pasa de la última página, se devuelve la última |
| `porPagina` | entero 1–50 (por defecto 10) | |

Reglas:

- **Fechas (`desde` / `hasta`):** días completos en hora de Nayarit (`America/Mazatlan`). Los tickets activos se comparan por `creadoEn` (fecha del reporte) y los Cerrados o Cancelados por `cerradoEn`. Así un mismo ticket cae en el mismo rango en cualquier vista.
- **Orden:** primero los activos, por `venceEn` ascendente (los más urgentes primero); después los Cerrados y Cancelados, por `cerradoEn` descendente (los más recientes primero).
- **`conteos`:** cuántos tickets hay en cada vista aplicando todos los filtros **excepto** `vista` y la paginación. El frontend los muestra en las pestañas.
- Cada elemento de `datos` tiene la forma completa de Ticket.

Ejemplo: `GET /tickets?vista=activos&tecnico=sin`

Respuesta `200` (tickets abreviados):

```json
{
  "datos": [
    { "id": "14", "estado": "ABIERTO", "tecnico": null, "venceEn": "2026-11-08T15:43:00.000Z", "...": "..." },
    { "id": "13", "estado": "ABIERTO", "tecnico": null, "venceEn": "2026-11-08T21:43:00.000Z", "...": "..." },
    { "id": "15", "estado": "ABIERTO", "tecnico": null, "venceEn": "2026-11-11T16:43:00.000Z", "...": "..." }
  ],
  "total": 3,
  "pagina": 1,
  "porPagina": 10,
  "conteos": { "todos": 4, "activos": 3, "cerrados": 1 }
}
```

Errores: `401` sin sesión, `403` si el rol no es `ADMIN`.

---

### `GET /catalogos`

Valores para llenar los filtros. **Rol:** cualquier usuario con sesión.

Respuesta `200`:

```json
{
  "edificios": ["Edificio A", "Edificio B", "Edificio C"],
  "tiposEquipo": [
    "Aire acondicionado", "Computadora", "Contacto eléctrico",
    "Instalación hidráulica", "Luminaria", "Pizarrón", "Proyector"
  ],
  "categorias": [
    { "id": "c1", "nombre": "Climatización", "horasObjetivo": 48 },
    { "id": "c2", "nombre": "Audiovisual", "horasObjetivo": 24 },
    { "id": "c3", "nombre": "Cómputo", "horasObjetivo": 72 },
    { "id": "c4", "nombre": "Eléctrica", "horasObjetivo": 48 },
    { "id": "c5", "nombre": "Plomería", "horasObjetivo": 12 }
  ]
}
```

`edificios` y `tiposEquipo` van ordenados alfabéticamente.

Errores: `401` sin sesión.

---

### `GET /tickets/:id`

Un ticket con su forma completa. **Rol:** `ADMIN`.

Respuesta `200`: un Ticket (ver el ejemplo en "Formas de datos").

Errores: `401` sin sesión, `403` si el rol no es `ADMIN`, `404` si no existe:

```json
{ "mensaje": "Este ticket no existe." }
```

---

### `GET /tecnicos`

Técnicos **activos** con su carga actual, para elegir a quién asignar. **Rol:** `ADMIN`.

`activos` = número de tickets activos asignados a ese técnico. Ordenados por nombre.

Respuesta `200`:

```json
[
  { "id": "u4", "nombre": "[TÉCNICO 1]", "activos": 2 },
  { "id": "u2", "nombre": "[TÉCNICO 2]", "activos": 3 }
]
```

Errores: `401` sin sesión, `403` si el rol no es `ADMIN`.

---

### `PATCH /tickets/:id/asignar`

Asigna o reasigna el técnico de un ticket activo. **Rol:** `ADMIN`.

Petición:

```json
{ "tecnicoId": "u4" }
```

Efectos:

- `tecnico` pasa a ser el técnico elegido y `estado` a `ASIGNADO`, también si estaba `EN_PROCESO` (al reasignar, el nuevo técnico lo retoma).
- Se agrega al `historial`: `{ estado: "ASIGNADO", usuario: <admin>, tecnico: <técnico>, comentario, fecha }`. Al reasignar, `comentario` dice quién lo tenía antes; si no, es `null`.

Respuesta `200`: el Ticket actualizado, con su forma completa.

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | `tecnicoId` no es un técnico activo | `Elige un técnico válido.` |
| `400` | Ya está asignado a ese técnico | `El ticket ya está asignado a ese técnico.` |
| `404` | El ticket no existe | `Este ticket no existe.` |
| `409` | El ticket está Cerrado o Cancelado | `Este ticket ya no está activo; no se puede asignar.` |

---

### `PATCH /tickets/:id/cancelar`

Cancela un ticket activo. No se puede deshacer. **Rol:** `ADMIN`.

Petición:

```json
{ "motivo": "Duplicado de otro ticket" }
```

`motivo` debe ser uno de:

- `Duplicado de otro ticket`
- `Reporte falso o de prueba`
- `No corresponde a mantenimiento`

Efectos:

- `estado` pasa a `CANCELADO`, `motivoCancelacion` = `motivo` y `cerradoEn` = ahora.
- Se agrega al `historial`: `{ estado: "CANCELADO", usuario: <admin>, comentario: <motivo>, fecha }`.

Respuesta `200`: el Ticket actualizado, con su forma completa.

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | Falta el motivo o no es válido | `Elige el motivo de la cancelación.` |
| `404` | El ticket no existe | `Este ticket no existe.` |
| `409` | El ticket ya está Cerrado o Cancelado | `Este ticket ya no está activo; no se puede cancelar.` |

---

### `GET /equipos`

Lista de equipos con sus fallas. **Rol:** `ADMIN`.

| Parámetro | Valores | Descripción |
| --- | --- | --- |
| `q` | texto | Busca en `tipo` y `descripcion`; no distingue mayúsculas ni acentos |
| `edificio` | texto | Igual a `ubicacion.edificio` |
| `tipo` | texto | Igual a `tipo` |
| `estado` | `ACTIVO` (por defecto) · `BAJA` · `TODOS` | |

Orden: por `fallas` descendente (los candidatos a reemplazo primero); empate por `ultimaFalla` más reciente y luego por `tipo`.

Respuesta `200`:

```json
[
  {
    "id": "e1",
    "tipo": "Aire acondicionado",
    "descripcion": "Minisplit Mirage 2 ton",
    "ubicacion": { "edificio": "Edificio B", "aula": "Aula 3" },
    "estado": "ACTIVO",
    "fallas": 6,
    "ultimaFalla": "2026-11-06T16:00:00.000Z"
  },
  {
    "id": "e9",
    "tipo": "Proyector",
    "descripcion": "Epson PowerLite E20",
    "ubicacion": { "edificio": "Edificio B", "aula": "Aula 2" },
    "estado": "ACTIVO",
    "fallas": 0,
    "ultimaFalla": null
  }
]
```

Errores: `401` sin sesión, `403` si el rol no es `ADMIN`.

---

### `GET /equipos/:id`

Ficha, estadísticas y tickets de un equipo. **Rol:** `ADMIN`.

| Campo | Descripción |
| --- | --- |
| `equipo` | Equipo (con `fallas` y `ultimaFalla`) |
| `estadisticas.fallasTotales` | Tickets no cancelados del equipo, de siempre |
| `estadisticas.tiempoPromedioHoras` | Promedio de `cerradoEn − creadoEn` en horas (un decimal), **solo con tickets `CERRADO`**. `null` si no hay ninguno |
| `estadisticas.ultimaFalla` | Igual que `equipo.ultimaFalla` |
| `estadisticas.fallasUltimos90` | Fallas en la ventana de la regla de reemplazo (igual que `equipo.fallas`) |
| `tickets` | Todos los tickets del equipo (incluidos cancelados), forma completa, del más reciente al más antiguo por `creadoEn` |

Respuesta `200` (tickets abreviados):

```json
{
  "equipo": {
    "id": "e1",
    "tipo": "Aire acondicionado",
    "descripcion": "Minisplit Mirage 2 ton",
    "ubicacion": { "edificio": "Edificio B", "aula": "Aula 3" },
    "estado": "ACTIVO",
    "fallas": 6,
    "ultimaFalla": "2026-11-06T16:00:00.000Z"
  },
  "estadisticas": {
    "fallasTotales": 7,
    "tiempoPromedioHoras": 38.7,
    "ultimaFalla": "2026-11-06T16:00:00.000Z",
    "fallasUltimos90": 6
  },
  "tickets": [
    { "id": "14", "estado": "ABIERTO", "...": "..." },
    { "id": "8", "estado": "CERRADO", "...": "..." }
  ]
}
```

Errores: `401`, `403`, `404` `{ "mensaje": "Este equipo no existe." }`.

---

### `POST /equipos`

Agrega un equipo (queda `ACTIVO`). **Rol:** `ADMIN`.

Petición:

```json
{
  "tipo": "Luminaria",
  "descripcion": "Panel LED 60×60",
  "ubicacion": { "edificio": "Edificio A", "aula": "Aula 2" }
}
```

Respuesta `201`: el Equipo creado (`fallas: 0`, `ultimaFalla: null`).

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | Falta un campo o no es válido | `Elige un tipo de equipo válido.` · `Escribe la descripción del equipo.` · `Elige un edificio válido.` · `Escribe el aula o espacio.` |
| `409` | Ya hay un equipo con el mismo tipo, descripción y ubicación (sin distinguir mayúsculas ni acentos) | `Ya existe un equipo igual en esa ubicación.` |

---

### `PATCH /equipos/:id`

Edita un equipo o lo da de baja. **Rol:** `ADMIN`.

Petición (todos los campos son opcionales; se cambian solo los que vienen):

```json
{
  "tipo": "Aire acondicionado",
  "descripcion": "Minisplit Mirage 2 ton",
  "ubicacion": { "edificio": "Edificio B", "aula": "Aula 3" },
  "estado": "BAJA"
}
```

Los tickets del equipo muestran los datos actualizados. Dar de baja no borra su historial.

Respuesta `200`: el Equipo actualizado.

Errores: los mismos `400` y `409` que `POST /equipos` (y `400` `Estado no válido.`), `404` si no existe.

---

### `GET /configuracion`

Valores configurables del sistema. **Rol:** `ADMIN`.

Respuesta `200`:

```json
{ "reemplazo": { "fallas": 4, "dias": 90 } }
```

`reemplazo`: un equipo es candidato a reemplazo con `fallas` o más fallas en los últimos `dias` días. Se ajustará desde la pantalla Categorías.
