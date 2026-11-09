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

**Roles:** `ADMIN`, `TECNICO`, `REPORTANTE`.

---

## Formas de datos

### Usuario

```json
{
  "id": "u1",
  "nombre": "Administración de Mantenimiento",
  "correo": "admin@utnay.edu.mx",
  "rol": "ADMIN"
}
```

Nunca se devuelve la contraseña.

### Ticket

```js
{
  id,                 // string. Folio que se muestra como "#14"
  descripcion,        // string. Lo que escribió quien reporta
  estado,             // "ABIERTO" | "ASIGNADO" | "EN_PROCESO" | "CERRADO" | "CANCELADO"
  equipo: {
    id, tipo,         // tipo: "Aire acondicionado", "Proyector", "Computadora", ...
    descripcion,      // marca / modelo / número de equipo
    ubicacion: { edificio, aula }   // "Edificio B", "Aula 3"
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
  cerradoEn,          // fecha ISO | null
  historial: [        // en orden cronológico, el primero es "ABIERTO"
    { estado, usuario: { id, nombre }, comentario /* string | null */, fecha }
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
      "comentario": null,
      "fecha": "2026-11-07T16:00:00.000Z"
    }
  ],
  "sumados": []
}
```

### Reglas que comparten frontend y backend

- **Activo:** ticket que no está `CERRADO` ni `CANCELADO`.
- **Sin asignar:** ticket activo con `tecnico: null`.
- **Semáforo** (solo activos; lo calcula el frontend con `creadoEn`, `venceEn` y la hora actual):
  - *A tiempo:* queda más del 25 % del tiempo.
  - *Por vencer:* queda el 25 % o menos.
  - *Vencido:* ya pasó `venceEn`.
- **Fallas de un equipo:** tickets de ese equipo que no están `CANCELADO`.
- **Regla de reemplazo:** 4 o más fallas en los últimos 90 días.

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
    "rol": "ADMIN"
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
