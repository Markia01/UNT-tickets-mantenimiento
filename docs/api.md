# Contrato de la API — Sistema de tickets de mantenimiento UTN

Este documento es el acuerdo entre el frontend y el backend de la app de Next.js: las pantallas
llaman a `src/api/` y la API vive en `src/app/api/` (Route Handlers).
Los datos de prueba del frontend (`src/api/mocks/`) usan exactamente estas formas y rutas.
**Cada vista nueva agrega aquí sus endpoints.**

## Convenciones

- **Rutas:** la API está en la misma app que el frontend, así que todas las rutas empiezan con `/api`
  (por ejemplo `POST /api/auth/login` → `src/app/api/auth/login/route.js`). El frontend las llama con
  rutas relativas, sin URL base. Con `NEXT_PUBLIC_USE_MOCKS=true` responde `src/api/mocks/` en su lugar.
- **Formato:** JSON en peticiones y respuestas (`Content-Type: application/json`), salvo los endpoints
  que reciben una foto (`POST /api/tickets` y `PATCH /api/tickets/:id/cerrar`): esos reciben
  `multipart/form-data` y la foto va en el campo **`foto`**. Las respuestas siempre son JSON.
- **Fotos:** solo imágenes (`image/*`) de **5 MB como máximo**. El backend las guarda y en el ticket
  devuelve su URL (`"/api/fotos/<id>"`; se guardan en la colección `fotos` y se sirven en `GET /api/fotos/:id`, sin token). No se aceptan SVG. Si no cumple: `400` con el mensaje
  `El archivo debe ser una imagen (JPG, PNG, HEIC…).` o `La foto pesa más de 5 MB. Toma otra o elige una más ligera.`
- **Creación:** los `POST` que crean algo responden `201` con lo creado.
- **Autenticación:** después de iniciar sesión, cada petición manda el token en el encabezado
  `Authorization: Bearer <token>`.
- **Fechas:** cadenas ISO 8601 en UTC (`"2026-11-08T15:30:00.000Z"`). El frontend las muestra en hora local.
- **Errores:** cualquier respuesta que no sea 2xx devuelve `{ "mensaje": "Texto para mostrar al usuario" }`, en español.
  Algunos errores agregan datos (por ejemplo el `409` de `POST /api/tickets` trae `ticketId`).

| Código | Cuándo |
| --- | --- |
| `400` | Datos inválidos |
| `401` | Sin token, token inválido o vencido (el frontend cierra la sesión y manda a `/login`). En `POST /api/auth/login` y `POST /api/auth/cambiar-contrasena`: correo o contraseña incorrectos |
| `403` | El rol del usuario no tiene permiso para el endpoint, o el recurso no es suyo (un técnico con un ticket que no tiene asignado, un reportante con un ticket que no reportó) |
| `404` | El recurso no existe |
| `409` | La acción no aplica al estado actual (por ejemplo, asignar un ticket cerrado) o crearía un duplicado (correo ya registrado, reporte de un equipo que ya tiene uno activo) |

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

Nunca se devuelve la contraseña. `activo: false` = usuario desactivado: no puede iniciar sesión (`403` en el
login), su token deja de valer (`401` en cualquier endpoint) y no aparece en `GET /api/tecnicos`.

Los `REPORTANTE` traen además `tipo`: `"Alumno"`, `"Docente"` o `"Personal"` (lo eligen al registrarse y se
copia en `reporta.tipo` de sus tickets).

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
  categoria: { id, nombre, horasObjetivo },   // copia de la categoría al crear el ticket (ver "Categoría")
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
  sumados: [ { id, nombre } ]   // personas que reportaron la misma falla (POST /api/tickets/:id/sumarme)
}
```

En `GET /api/tickets/mios` cada ticket trae además `relacion`: `"PROPIO"` (lo reportó el usuario) o
`"SUMADO"` (se sumó).

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

### Categoría

```json
{ "id": "c1", "nombre": "Climatización", "horasObjetivo": 48, "activa": true }
```

- `horasObjetivo`: entero mayor que 0. Horas para atender un ticket de esa categoría (`venceEn = creadoEn + horasObjetivo`).
- `activa: false` = ya no se puede elegir al reportar (no sale en `GET /api/catalogos` y `POST /api/tickets` la rechaza).
  Sus tickets se conservan. Las categorías **no se borran**.
- En `GET /api/categorias` cada una trae además `ticketsActivos` (número de tickets activos con esa categoría).
- **Cada ticket guarda una copia** de `{ id, nombre, horasObjetivo }` al crearse. Editar la categoría después
  solo afecta a los tickets nuevos: los existentes conservan su nombre, sus horas y su `venceEn`.

### Equipo

```js
{
  id,
  tipo,               // uno de GET /api/catalogos → tiposEquipo
  descripcion,        // marca, modelo o número: "Dell OptiPlex 3080 · equipo 12"
  ubicacion: { edificio, aula },   // "Edificio B", "Aula 3" (aula = aula o espacio)
  estado,             // "ACTIVO" | "BAJA". Un equipo dado de baja conserva su historial
  fallas,             // fallas en la ventana de la regla de reemplazo (90 días)
  ultimaFalla         // fecha ISO del ticket no cancelado más reciente | null
}
```

`fallas` y `ultimaFalla` se calculan; solo vienen en las respuestas de `/api/equipos`.

### Reglas que comparten frontend y backend

- **Activo:** ticket que no está `CERRADO` ni `CANCELADO`.
- **Sin asignar:** ticket activo con `tecnico: null`.
- **Semáforo** (solo activos; lo calcula el frontend con `creadoEn`, `venceEn` y la hora actual):
  - *A tiempo:* queda más del 25 % del tiempo.
  - *Por vencer:* queda el 25 % o menos.
  - *Vencido:* ya pasó `venceEn`.
- **Fallas de un equipo:** tickets de ese equipo que no están `CANCELADO`.
- **Regla de reemplazo:** 4 o más fallas en los últimos 90 días. Los valores vienen de `GET /api/configuracion`.

---

## Endpoints

### `POST /api/auth/login`

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

Respuesta `403` (la contraseña es correcta pero el usuario está desactivado):

```json
{ "mensaje": "Tu cuenta está desactivada. Pide ayuda al área de mantenimiento." }
```

---

### `POST /api/auth/cambiar-contrasena`

Cambia la contraseña de un usuario que conoce la actual. **Rol:** público (no lleva token: se usa
desde la pantalla `/cambiar-contrasena`, sin sesión iniciada).

Petición:

```json
{ "correo": "admin@utnay.edu.mx", "actual": "demo1234", "nueva": "nuevaClave2026" }
```

- `correo`: correo institucional (`@utnay.edu.mx`), en minúsculas.
- `nueva`: mínimo 8 caracteres.

Respuesta `200`:

```json
{ "mensaje": "Contraseña actualizada" }
```

Respuesta `401` (el correo no existe o la contraseña actual no coincide; no se distingue cuál):

```json
{ "mensaje": "La contraseña actual no es correcta" }
```

Respuesta `400` (la nueva contraseña tiene menos de 8 caracteres):

```json
{ "mensaje": "La nueva contraseña debe tener al menos 8 caracteres" }
```

---

### `POST /api/auth/registro`

Crea una cuenta y deja la sesión iniciada. **Rol:** público (sin token). La cuenta nueva siempre es
`REPORTANTE`; los técnicos y administradores los da de alta mantenimiento.

Petición:

```json
{ "nombre": "Ana López", "correo": "ana.lopez@utnay.edu.mx", "tipo": "Alumno", "contrasena": "clave2026" }
```

- `nombre`: mínimo 3 caracteres.
- `correo`: termina en `@utnay.edu.mx`; se guarda sin espacios y en minúsculas.
- `tipo`: `Alumno`, `Docente` o `Personal`.
- `contrasena`: mínimo 8 caracteres. Se guarda cifrada.

Respuesta `201` (igual que el login):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": "u20",
    "nombre": "Ana López",
    "correo": "ana.lopez@utnay.edu.mx",
    "rol": "REPORTANTE",
    "tipo": "Alumno",
    "activo": true
  }
}
```

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | Nombre muy corto | `Escribe tu nombre completo.` |
| `400` | Correo de otro dominio | `El correo debe terminar en @utnay.edu.mx` |
| `400` | Tipo no válido | `Elige si eres alumno, docente o personal.` |
| `400` | Contraseña corta | `La contraseña debe tener al menos 8 caracteres.` |
| `409` | Ya hay una cuenta con ese correo | `Ya existe una cuenta con ese correo.` |

---

### `GET /api/admin/resumen`

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

### `GET /api/tickets`

Lista paginada de tickets con filtros. **Rol:** `ADMIN`.

Parámetros de consulta (todos opcionales):

| Parámetro | Valores | Descripción |
| --- | --- | --- |
| `vista` | `todos` (por defecto) · `activos` · `cerrados` | `cerrados` incluye Cerrados y Cancelados |
| `q` | texto | Búsqueda por ID. Coincidencia exacta; se ignoran `#` y espacios (`#14` = `14`) |
| `desde` | `YYYY-MM-DD` | Desde ese día, incluido |
| `hasta` | `YYYY-MM-DD` | Hasta ese día, incluido |
| `edificio` | texto | Igual a `equipo.ubicacion.edificio` (valores de `GET /api/catalogos`) |
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

Ejemplo: `GET /api/tickets?vista=activos&tecnico=sin`

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

### `GET /api/catalogos`

Valores para llenar los filtros y el formulario de reporte. **Rol:** cualquier usuario con sesión.

Respuesta `200`:

```json
{
  "edificios": ["Edificio A", "Edificio B", "Edificio C"],
  "tiposEquipo": [
    "Aire acondicionado", "Computadora", "Contacto eléctrico",
    "Instalación hidráulica", "Luminaria", "Pizarrón", "Proyector"
  ],
  "categorias": [
    { "id": "c2", "nombre": "Audiovisual", "horasObjetivo": 24 },
    { "id": "c1", "nombre": "Climatización", "horasObjetivo": 48 },
    { "id": "c3", "nombre": "Cómputo", "horasObjetivo": 72 },
    { "id": "c4", "nombre": "Eléctrica", "horasObjetivo": 48 },
    { "id": "c5", "nombre": "Plomería", "horasObjetivo": 12 }
  ],
  "equipos": [
    {
      "id": "e5",
      "tipo": "Instalación hidráulica",
      "descripcion": "Lavabos y llaves de los baños",
      "ubicacion": { "edificio": "Edificio A", "aula": "Baños PB" }
    },
    {
      "id": "e2",
      "tipo": "Proyector",
      "descripcion": "Epson PowerLite X49",
      "ubicacion": { "edificio": "Edificio A", "aula": "Aula 1" }
    }
  ]
}
```

- `edificios` y `tiposEquipo` van ordenados alfabéticamente.
- `categorias`: solo las **activas** (sin `activa` ni `ticketsActivos`), ordenadas por nombre. Las inactivas
  están en `GET /api/categorias` (el filtro de categoría de `/admin/tickets` usa esa, para poder buscar sus tickets).
- `equipos`: solo los `ACTIVO` (sin `estado`, `fallas` ni `ultimaFalla`), ordenados por edificio, aula y tipo.
  El formulario de `/reportar` filtra con ellos en cascada: edificio → aula → equipo.

Errores: `401` sin sesión.

---

### `GET /api/tickets/:id`

Un ticket con su forma completa. **Rol:** cualquier usuario con sesión, con estas reglas:

| Rol | Puede ver |
| --- | --- |
| `ADMIN` | Cualquier ticket |
| `TECNICO` | Solo los que tiene asignados (`tecnico.id` = su id) |
| `REPORTANTE` | Solo los que reportó (`reporta.id`) o a los que se sumó (`sumados`) |

Respuesta `200`: un Ticket (ver el ejemplo en "Formas de datos").

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `404` | El ticket no existe (se revisa primero) | `Este ticket no existe.` |
| `403` | Técnico con un ticket que no es suyo | `Este ticket no está asignado a ti.` |
| `403` | Reportante con un ticket que no reportó ni al que se sumó | `No tienes permiso para ver este reporte.` |

---

### `GET /api/tecnicos`

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

### `PATCH /api/tickets/:id/asignar`

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

### `PATCH /api/tickets/:id/cancelar`

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

### `GET /api/equipos`

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

### `GET /api/equipos/:id`

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

### `POST /api/equipos`

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

### `PATCH /api/equipos/:id`

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

Errores: los mismos `400` y `409` que `POST /api/equipos` (y `400` `Estado no válido.`), `404` si no existe.

---

### `GET /api/configuracion`

Valores configurables del sistema. **Rol:** `ADMIN`.

Respuesta `200`:

```json
{ "reemplazo": { "fallas": 4, "dias": 90 } }
```

`reemplazo`: un equipo es candidato a reemplazo con `fallas` o más fallas en los últimos `dias` días. Se ajustará desde la pantalla Categorías.

---

## Endpoints de quien reporta (`REPORTANTE`)

> En el backend, `/api/tickets/activo` y `/api/tickets/mios` son carpetas fijas
> (`src/app/api/tickets/activo/route.js`, `.../mios/route.js`): Next las prefiere sobre `[id]`.

### `GET /api/tickets/activo?equipoId=e5`

¿El equipo ya tiene un reporte activo? Se consulta al elegir el equipo en `/reportar`, para ofrecer
"Sumarme a este reporte" en lugar de crear un duplicado. **Rol:** `REPORTANTE`.

Respuesta `200` (si hay varios activos, el más reciente por `creadoEn`):

```json
{ "ticket": { "id": "13", "estado": "ABIERTO", "descripcion": "Fuga de agua en la llave del segundo lavabo…", "sumados": [], "...": "..." } }
```

Sin reporte activo: `{ "ticket": null }`. El ticket va con su forma completa.

Errores: `400` `Falta el equipo.` · `404` `Este equipo no existe.`

---

### `POST /api/tickets`

Crea un reporte (ticket en estado `ABIERTO`). **Rol:** `REPORTANTE`.
**Formato:** `multipart/form-data`.

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| `equipoId` | sí | Equipo `ACTIVO` |
| `categoriaId` | sí | Categoría **activa** (de `GET /api/catalogos`) |
| `descripcion` | sí | De 15 a 1000 caracteres (sin contar espacios al inicio y al final) |
| `foto` | no | Imagen de máximo 5 MB |
| `esFallaDistinta` | no | `"true"` para crearlo aunque el equipo ya tenga un reporte activo (el usuario eligió "Es una falla distinta") |

Efectos:

- `reporta` = `{ id, nombre, tipo }` del usuario; `tecnico: null`; `sumados: []`.
- `categoria` = copia de `{ id, nombre, horasObjetivo }` de la categoría en ese momento.
- `creadoEn` = ahora; `venceEn` = `creadoEn` + `categoria.horasObjetivo` horas.
- `historial` = `[{ estado: "ABIERTO", usuario: <quien reporta>, comentario: null, fecha: creadoEn }]`.
- `fotoReporte` = URL de la foto guardada o `null`.
- El folio (`id`) es consecutivo.

Respuesta `201`: el Ticket creado, con su forma completa. El frontend va a `/reportes/:id/enviado`.

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | Equipo inexistente o dado de baja | `Elige un equipo válido.` |
| `400` | Falta la categoría, no existe o está inactiva | `Elige la categoría de la falla.` |
| `400` | Descripción corta | `Describe la falla con al menos 15 caracteres.` |
| `400` | Descripción larga | `La descripción no puede pasar de 1000 caracteres.` |
| `400` | Foto no válida | (ver "Fotos" en Convenciones) |
| `409` | El equipo ya tiene un reporte activo y no vino `esFallaDistinta=true` | `Ya hay un reporte activo de este equipo (#13). Súmate a ese reporte o indica que es una falla distinta.` |

El `409` trae además el folio del reporte activo:

```json
{ "mensaje": "Ya hay un reporte activo de este equipo (#13). Súmate a ese reporte o indica que es una falla distinta.", "ticketId": "13" }
```

---

### `POST /api/tickets/:id/sumarme`

El usuario dice que tiene la misma falla: se agrega a `sumados` del ticket. Sin cuerpo. **Rol:** `REPORTANTE`.

Respuesta `200`: el Ticket actualizado. El frontend va a `/reportes/:id/enviado` ("Te sumaste al reporte").

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `404` | El ticket no existe | `Este ticket no existe.` |
| `409` | Está Cerrado o Cancelado | `Este reporte ya no está activo; si la falla sigue, repórtala de nuevo.` |
| `409` | Lo reportó el mismo usuario | `Tú hiciste este reporte.` |
| `409` | Ya estaba en `sumados` | `Ya te sumaste a este reporte.` |

---

### `GET /api/tickets/mios`

Los tickets que reportó el usuario y aquellos a los que se sumó. **Rol:** `REPORTANTE`.

| Parámetro | Valores | Descripción |
| --- | --- | --- |
| `estado` | `todos` (por defecto) · `activos` · `cerrados` · `cancelados` | `activos` = Abierto, Asignado o En proceso |

- Orden: por `creadoEn` descendente (los más recientes primero). Sin paginación.
- Cada ticket tiene la forma completa más `relacion` (`"PROPIO"` o `"SUMADO"`).
- `conteos`: cuántos hay en cada valor de `estado` (sin aplicar el filtro).

Respuesta `200` (tickets abreviados):

```json
{
  "datos": [
    { "id": "12", "estado": "ASIGNADO", "relacion": "PROPIO", "...": "..." },
    { "id": "11", "estado": "ASIGNADO", "relacion": "SUMADO", "...": "..." }
  ],
  "conteos": { "todos": 8, "activos": 3, "cerrados": 4, "cancelados": 1 }
}
```

---

## Endpoints del técnico (`TECNICO`)

### `GET /api/tecnico/tickets`

Los tickets asignados al técnico que hace la petición. **Rol:** `TECNICO`.

| Parámetro | Valores | Descripción |
| --- | --- | --- |
| `vista` | `asignados` (por defecto) · `proceso` · `cerrados` | `asignados` = estado `ASIGNADO`; `proceso` = `EN_PROCESO`; `cerrados` = `CERRADO` con `cerradoEn` en los últimos 7 días |

- Orden: `asignados` y `proceso` por `venceEn` ascendente (los más urgentes primero); `cerrados` por
  `cerradoEn` descendente.
- `conteos`: cuántos hay en cada vista.
- El semáforo lo calcula el frontend (`calcularSemaforo`).

Respuesta `200` (tickets abreviados):

```json
{
  "datos": [
    { "id": "12", "estado": "ASIGNADO", "venceEn": "2026-11-19T06:51:00.000Z", "...": "..." },
    { "id": "9", "estado": "ASIGNADO", "venceEn": "2026-11-19T20:51:00.000Z", "...": "..." }
  ],
  "conteos": { "asignados": 2, "proceso": 1, "cerrados": 2 }
}
```

---

### `PATCH /api/tickets/:id/en-proceso`

El técnico empieza a atender el ticket. Sin cuerpo. **Rol:** `TECNICO` (solo el asignado).

Efectos: `estado` pasa a `EN_PROCESO` y se agrega al `historial`
`{ estado: "EN_PROCESO", usuario: <técnico>, comentario: null, fecha }`.

Respuesta `200`: el Ticket actualizado.

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `403` | No es el técnico asignado | `Este ticket no está asignado a ti.` |
| `404` | El ticket no existe | `Este ticket no existe.` |
| `409` | El estado no es `ASIGNADO` | `Solo un ticket Asignado se puede marcar en proceso.` |

---

### `PATCH /api/tickets/:id/cerrar`

El técnico cierra el ticket con evidencia. **Rol:** `TECNICO` (solo el asignado).
**Formato:** `multipart/form-data`.

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| `foto` | **sí** | Foto del arreglo: imagen de máximo 5 MB |
| `comentario` | sí | Qué se hizo, de 10 a 1000 caracteres |

Efectos: `estado` = `CERRADO`, `fotoCierre` = URL de la foto, `comentarioCierre` = `comentario`,
`cerradoEn` = ahora, y se agrega al `historial` `{ estado: "CERRADO", usuario: <técnico>, comentario, fecha }`.

Respuesta `200`: el Ticket actualizado.

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | No viene la foto | `La foto del arreglo es obligatoria para cerrar el ticket.` |
| `400` | Foto no válida | (ver "Fotos" en Convenciones) |
| `400` | Comentario corto o largo | `Escribe qué se hizo (mínimo 10 caracteres).` · `El comentario no puede pasar de 1000 caracteres.` |
| `403` | No es el técnico asignado | `Este ticket no está asignado a ti.` |
| `404` | El ticket no existe | `Este ticket no existe.` |
| `409` | El estado no es `EN_PROCESO` | `Solo un ticket En proceso se puede cerrar.` |

---

## Endpoints de administración (`ADMIN`)

### `GET /api/usuarios`

Todos los usuarios (activos e inactivos), para la pantalla Usuarios. **Rol:** `ADMIN`.

| Parámetro | Valores | Descripción |
| --- | --- | --- |
| `q` | texto | Busca en `nombre` y `correo`; no distingue mayúsculas ni acentos |
| `rol` | `ADMIN` · `TECNICO` · `REPORTANTE` | Igual a `rol`. Otro valor se ignora |

Orden: por `nombre`. Sin paginación. Cada elemento tiene la forma de Usuario (los `REPORTANTE` con `tipo`).

Respuesta `200`:

```json
[
  { "id": "u5", "nombre": "[ALUMNO 1]", "correo": "alumno1@utnay.edu.mx", "rol": "REPORTANTE", "tipo": "Alumno", "activo": true },
  { "id": "u1", "nombre": "Administración de Mantenimiento", "correo": "admin@utnay.edu.mx", "rol": "ADMIN", "activo": true },
  { "id": "u9", "nombre": "[TÉCNICO 3]", "correo": "tecnico3@utnay.edu.mx", "rol": "TECNICO", "activo": false }
]
```

Errores: `401` sin sesión, `403` si el rol no es `ADMIN`.

---

### `POST /api/usuarios`

Da de alta a un técnico o administrador. Los reportantes no se crean aquí: se registran solos
(`POST /api/auth/registro`). **Rol:** `ADMIN`.

Petición:

```json
{ "nombre": "Ana Ruiz", "correo": "ana.ruiz@utnay.edu.mx", "rol": "TECNICO" }
```

- `nombre`: de 3 a 80 caracteres (se recortan los espacios de los extremos y los dobles).
- `correo`: termina en `@utnay.edu.mx`; se guarda sin espacios y en minúsculas.
- `rol`: `TECNICO` o `ADMIN`.

Efectos: el backend **genera una contraseña temporal** (10 caracteres, sin `0/O/1/l/I`), la guarda cifrada
y la devuelve **solo en esta respuesta**. El usuario queda `activo: true`.

Respuesta `201`:

```json
{
  "usuario": { "id": "u10", "nombre": "Ana Ruiz", "correo": "ana.ruiz@utnay.edu.mx", "rol": "TECNICO", "activo": true },
  "contrasenaTemporal": "Kp7mRw2xTa"
}
```

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | Nombre corto o largo | `Escribe el nombre completo.` · `El nombre no puede pasar de 80 caracteres.` |
| `400` | Correo de otro dominio | `El correo debe terminar en @utnay.edu.mx` |
| `400` | Rol que no es `TECNICO` ni `ADMIN` | `Elige si es técnico o administrador.` |
| `409` | Ya hay una cuenta con ese correo | `Ya existe una cuenta con ese correo.` |

---

### `PATCH /api/usuarios/:id`

Edita el nombre o el rol, o activa/desactiva a un usuario. **Rol:** `ADMIN`.

Petición (todos opcionales; se cambian solo los que vienen):

```json
{ "nombre": "Ana Ruiz López", "rol": "ADMIN", "activo": false }
```

- `nombre`: mismas reglas que al crear. El correo no se puede cambiar.
- `rol`: `TECNICO` o `ADMIN` (un `REPORTANTE` se puede convertir en técnico o administrador; entonces pierde `tipo`).
  Mandar el mismo rol que ya tiene no cuenta como cambio.
- `activo`: `true` o `false`. Desactivar no borra nada: sus tickets y reportes se conservan.

Respuesta `200`: el Usuario actualizado.

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | Nombre no válido | (los del `POST`) |
| `400` | Rol no válido | `Elige si es técnico o administrador.` |
| `400` | `activo` no es booleano | `Estado no válido.` |
| `403` | El admin intenta desactivarse a sí mismo | `No puedes desactivar tu propia cuenta.` |
| `403` | El admin intenta cambiar su propio rol | `No puedes cambiar tu propio rol.` |
| `404` | El usuario no existe | `Este usuario no existe.` |
| `409` | Un técnico con tickets activos asignados se desactiva o deja de ser técnico | `Tiene 2 tickets activos. Reasígnalos a otro técnico antes de continuar.` (`1 ticket activo` si es uno) |

---

### `POST /api/usuarios/:id/restablecer`

Genera una contraseña temporal nueva (la anterior deja de funcionar). Sin cuerpo. **Rol:** `ADMIN`.

Respuesta `200` (la contraseña solo viene en esta respuesta):

```json
{ "contrasenaTemporal": "Hq4vNs8ePz" }
```

Errores: `404` `Este usuario no existe.`

---

### `GET /api/categorias`

Todas las categorías (activas e inactivas) con su número de tickets activos. **Rol:** `ADMIN`.

Orden: por `nombre`.

Respuesta `200`:

```json
[
  { "id": "c2", "nombre": "Audiovisual", "horasObjetivo": 24, "activa": true, "ticketsActivos": 1 },
  { "id": "c6", "nombre": "Mobiliario", "horasObjetivo": 96, "activa": false, "ticketsActivos": 0 }
]
```

Errores: `401` sin sesión, `403` si el rol no es `ADMIN`.

---

### `POST /api/categorias`

Crea una categoría (queda `activa: true`). **Rol:** `ADMIN`.

Petición:

```json
{ "nombre": "Jardinería", "horasObjetivo": 72 }
```

- `nombre`: obligatorio, máximo 40 caracteres (se recortan los espacios de los extremos y los dobles).
  **Único** sin distinguir mayúsculas ni acentos (`computo` = `Cómputo`), contando las inactivas.
- `horasObjetivo`: número entero mayor que 0 (en JSON es número, no texto).

Respuesta `201`: la Categoría creada, con `ticketsActivos: 0`.

Errores:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | Falta el nombre o es largo | `Escribe el nombre de la categoría.` · `El nombre no puede pasar de 40 caracteres.` |
| `400` | Horas no válidas | `Las horas objetivo deben ser un número entero mayor que 0.` |
| `409` | Ya hay una categoría con ese nombre | `Ya existe una categoría con ese nombre.` |

---

### `PATCH /api/categorias/:id`

Edita una categoría o la activa/desactiva. No hay `DELETE`. **Rol:** `ADMIN`.

Petición (todos opcionales):

```json
{ "nombre": "Climatización", "horasObjetivo": 36, "activa": false }
```

Efectos: el cambio **solo afecta a los tickets nuevos** (cada ticket guarda una copia de su categoría,
ver "Categoría"). Los tickets existentes no cambian su `venceEn`.

Respuesta `200`: la Categoría actualizada, con `ticketsActivos`.

Errores: los mismos `400` y `409` que el `POST` (el `409` sin contar la propia categoría), y además:

| Código | Cuándo | `mensaje` |
| --- | --- | --- |
| `400` | `activa` no es booleano | `Estado no válido.` |
| `404` | La categoría no existe | `Esta categoría no existe.` |
| `409` | Es la única categoría activa y se intenta desactivar | `Debe quedar al menos una categoría activa para poder reportar.` |

---

## Checklist para conectar el backend

El frontend ya llama a todos estos endpoints desde `src/api/` y los mocks (`src/api/mocks/`) responden
con las mismas formas y errores. Para conectar la base de datos solo falta implementar cada ruta en
`src/app/api/` (Route Handlers), con los modelos en `src/models/` y la conexión en `src/lib/db.js`.

### Endpoints

| ✔ | Método y ruta | Archivo sugerido | Rol |
| --- | --- | --- | --- |
| ✔ | `POST /api/auth/login` | `src/app/api/auth/login/route.js` | público |
| ✔ | `POST /api/auth/registro` | `src/app/api/auth/registro/route.js` | público |
| ✔ | `POST /api/auth/cambiar-contrasena` | `src/app/api/auth/cambiar-contrasena/route.js` | público |
| ✔ | `GET /api/catalogos` | `src/app/api/catalogos/route.js` | con sesión |
| ✔ | `GET /api/configuracion` | `src/app/api/configuracion/route.js` | `ADMIN` |
| ✔ | `GET /api/admin/resumen` | `src/app/api/admin/resumen/route.js` | `ADMIN` |
| ✔ | `GET /api/tickets` | `src/app/api/tickets/route.js` (`GET`) | `ADMIN` |
| ✔ | `POST /api/tickets` (multipart) | `src/app/api/tickets/route.js` (`POST`) | `REPORTANTE` |
| ✔ | `GET /api/tickets/activo?equipoId=` | `src/app/api/tickets/activo/route.js` | `REPORTANTE` |
| ✔ | `GET /api/tickets/mios` | `src/app/api/tickets/mios/route.js` | `REPORTANTE` |
| ✔ | `GET /api/tickets/:id` | `src/app/api/tickets/[id]/route.js` | con sesión (reglas por rol) |
| ✔ | `POST /api/tickets/:id/sumarme` | `src/app/api/tickets/[id]/sumarme/route.js` | `REPORTANTE` |
| ✔ | `PATCH /api/tickets/:id/asignar` | `src/app/api/tickets/[id]/asignar/route.js` | `ADMIN` |
| ✔ | `PATCH /api/tickets/:id/cancelar` | `src/app/api/tickets/[id]/cancelar/route.js` | `ADMIN` |
| ✔ | `PATCH /api/tickets/:id/en-proceso` | `src/app/api/tickets/[id]/en-proceso/route.js` | `TECNICO` (asignado) |
| ✔ | `PATCH /api/tickets/:id/cerrar` (multipart) | `src/app/api/tickets/[id]/cerrar/route.js` | `TECNICO` (asignado) |
| ✔ | `GET /api/tecnico/tickets` | `src/app/api/tecnico/tickets/route.js` | `TECNICO` |
| ✔ | `GET /api/tecnicos` | `src/app/api/tecnicos/route.js` | `ADMIN` |
| ✔ | `GET /api/equipos` | `src/app/api/equipos/route.js` (`GET`) | `ADMIN` |
| ✔ | `POST /api/equipos` | `src/app/api/equipos/route.js` (`POST`) | `ADMIN` |
| ✔ | `GET /api/equipos/:id` | `src/app/api/equipos/[id]/route.js` (`GET`) | `ADMIN` |
| ✔ | `PATCH /api/equipos/:id` | `src/app/api/equipos/[id]/route.js` (`PATCH`) | `ADMIN` |
| ✔ | `GET /api/usuarios` | `src/app/api/usuarios/route.js` (`GET`) | `ADMIN` |
| ✔ | `POST /api/usuarios` | `src/app/api/usuarios/route.js` (`POST`) | `ADMIN` |
| ✔ | `PATCH /api/usuarios/:id` | `src/app/api/usuarios/[id]/route.js` | `ADMIN` |
| ✔ | `POST /api/usuarios/:id/restablecer` | `src/app/api/usuarios/[id]/restablecer/route.js` | `ADMIN` |
| ✔ | `GET /api/categorias` | `src/app/api/categorias/route.js` (`GET`) | `ADMIN` |
| ✔ | `POST /api/categorias` | `src/app/api/categorias/route.js` (`POST`) | `ADMIN` |
| ✔ | `PATCH /api/categorias/:id` | `src/app/api/categorias/[id]/route.js` | `ADMIN` |
| ✔ | `GET /api/fotos/:id` | `src/app/api/fotos/[id]/route.js` | público (lo usa `<img>`) |

### Base de datos

- Base `tickets_utn` (va en `MONGODB_URI`). Colecciones: `usuarios`, `categorias`, `equipos`, `tickets`,
  `contadores` (folio consecutivo de los tickets) y `fotos`. Se crean solas la primera vez que la app se
  conecta (por ejemplo al abrir `/api/salud`).
- Variables en `.env.local`: `MONGODB_URI` y `JWT_SECRET` (ver `.env.example`).
- Edificios, tipos de equipo y la regla de reemplazo están en `src/lib/api/config.js`.
- No hay usuarios precargados: los reportantes se registran en `/registro`. El primer administrador se
  hace registrándose y cambiando su `rol` a `"ADMIN"` en Atlas.

### Reglas comunes

- [ ] Leer el token de `Authorization: Bearer <token>`; sin token o inválido → `401`.
- [ ] Revisar el rol de cada endpoint → `403`. En `GET /api/tickets/:id`, `en-proceso` y `cerrar`, revisar
      además que el ticket sea del usuario.
- [ ] Errores siempre como `{ "mensaje": "…" }` en español, con los textos de este documento (el
      frontend los muestra tal cual).
- [ ] Fotos: leer con `await request.formData()` y `formData.get('foto')`; aceptar solo `image/*` de hasta
      5 MB; guardarlas y devolver su URL en `fotoReporte` / `fotoCierre`.
- [ ] Fechas en ISO 8601 UTC; `venceEn` = `creadoEn` + `horasObjetivo` de la categoría.
- [ ] Cada cambio de estado agrega una entrada al `historial`.
- [ ] Nunca devolver la contraseña; guardarla cifrada. La única excepción es `contrasenaTemporal` en
      `POST /api/usuarios` y `POST /api/usuarios/:id/restablecer` (se genera, se cifra y se devuelve una vez).
- [ ] Usuario con `activo: false`: `403` en el login y `401` con su token en cualquier otro endpoint.
- [ ] Ticket nuevo: guardar una **copia** de `{ id, nombre, horasObjetivo }` de su categoría (no una referencia
      que cambie al editarla). `GET /api/catalogos` solo devuelve categorías activas.

### Apagar los mocks

1. En `.env.local` cambiar `NEXT_PUBLIC_USE_MOCKS=true` por `NEXT_PUBLIC_USE_MOCKS=false`.
2. Reiniciar `npm run dev` (Next lee las variables `NEXT_PUBLIC_` al arrancar).
3. Con eso `src/api/cliente.js` deja de usar `src/api/mocks/` y llama a `/api/...` de la misma app.
   No hay que cambiar ninguna pantalla.
4. Los mocks se pueden dejar en el repositorio para desarrollar el frontend sin base de datos.
