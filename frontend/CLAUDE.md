# Frontend — Sistema de tickets de mantenimiento UTN

Este archivo le da contexto a Claude Code. Va en la carpeta `frontend/` del repositorio.

## Qué es

Interfaz web para reportar fallas de aulas y equipos de la Universidad Tecnológica de Nayarit y dar seguimiento a su atención. Este proyecto es **solo el frontend**: el backend (API REST con Node, Express y MongoDB) lo desarrolla otra persona en `backend/`. Mientras la API no esté lista, el frontend funciona con datos de prueba (mocks).

## Stack

- React + Vite, en **JavaScript** (sin TypeScript)
- Tailwind CSS v4 (plugin `@tailwindcss/vite`), con los colores del proyecto definidos en `src/index.css`
- React Router para las rutas
- No usar Bootstrap ni librerías de componentes. No instalar dependencias nuevas sin preguntar.

## Estructura

```
src/
├── api/
│   ├── cliente.js        # fetch con la URL base y el token JWT
│   ├── tickets.js        # una función por endpoint (getTickets, asignarTecnico, ...)
│   └── mocks/            # datos de prueba con la misma forma que la API
├── components/
│   ├── ui/               # Button, Pill, Card, Field, Modal, Toast, EmptyState, Skeleton
│   └── layout/           # AppLayout, Sidebar, Topbar (menú distinto por rol)
├── context/
│   └── AuthContext.jsx   # usuario actual, rol, token, login y logout
├── pages/
│   ├── auth/             # Login, Registro
│   ├── admin/            # Inicio, Tickets, DetalleTicket, Equipos, HistorialEquipo, Usuarios, Categorias
│   ├── reportante/       # Reportar, ReporteEnviado, MisReportes
│   ├── tecnico/          # MisTickets, AtenderTicket
│   └── errores/          # NoEncontrado (404), SinPermiso (403)
├── routes.jsx
└── index.css             # Tailwind + @theme con los colores
```

## Rutas y roles

| Ruta | Pantalla | Rol |
| --- | --- | --- |
| `/login` | Iniciar sesión | público |
| `/registro` | Crear cuenta (solo correos @utnay.edu.mx) | público |
| `/admin` | Inicio (resumen) | ADMIN |
| `/admin/tickets` | Lista de tickets | ADMIN |
| `/admin/tickets/:id` | Detalle del ticket | ADMIN |
| `/admin/equipos` | Equipos | ADMIN |
| `/admin/equipos/:id` | Historial del equipo | ADMIN |
| `/admin/usuarios` | Usuarios | ADMIN |
| `/admin/categorias` | Categorías y regla de reemplazo | ADMIN |
| `/reportar` | Reportar falla | REPORTANTE |
| `/reportes/:id/enviado` | Reporte enviado | REPORTANTE |
| `/mis-reportes` | Mis reportes | REPORTANTE |
| `/tecnico` | Mis tickets | TECNICO |
| `/tecnico/tickets/:id` | Atender y cerrar | TECNICO |
| `/403` y `*` | Sin permiso / No encontrado | todos |

Después de iniciar sesión se redirige según el rol: ADMIN → `/admin`, TECNICO → `/tecnico`, REPORTANTE → `/reportar`. Si un rol entra a una ruta que no es suya, va a `/403`.

## Guía de estilo (negro y crema)

Usar siempre estos nombres de Tailwind, nunca colores sueltos:

| Token | Valor | Uso |
| --- | --- | --- |
| `negro` | #111111 | Menú lateral, barra superior, botón principal, encabezado de tablas |
| `fondo` | #EFE7D6 | Fondo de la página |
| `tarjeta` | #FAF5EA | Tarjetas, tablas y formularios |
| `crema` | #F3EBDA | Texto sobre negro, opción activa del menú |
| `borde` | #DDD3BF | Bordes de tarjetas |
| `borde-campo` | #CFC4AD | Bordes de inputs |
| `campo` | #FFFDF8 | Fondo de inputs |
| `texto-2` | #5C5547 | Texto secundario y etiquetas |
| `peligro` | #A3231A | Errores y acciones destructivas |
| `ok-fondo` / `ok-texto` / `ok-punto` | #D6EBD9 / #1E5E33 / #2E8B4E | Semáforo "A tiempo" |
| `aviso-fondo` / `aviso-texto` / `aviso-punto` | #F5E3BC / #6E4300 / #D99A1E | Semáforo "Por vencer" |
| `error-fondo` / `error-texto` / `error-punto` | #F6D9D3 / #8A1C12 / #C8372D | Semáforo "Vencido" |

- Tipografía: `system-ui`. Título de la barra 20/600, título de detalle 26/700, título de tarjeta 16/600, texto 14, etiquetas de campo 12/600 en `texto-2`.
- Bordes redondeados: 8 px en botones y campos, 12 px en tarjetas, completos en etiquetas (pills).
- Layout con sesión: menú lateral negro de 240 px a toda la altura (se contrae a 72 px solo con íconos), barra superior negra con el nombre de la vista a la izquierda y el usuario (iniciales en un círculo crema) a la derecha, contenido sobre `fondo`.
- En celular: el menú lateral se oculta tras un botón ☰ y las tablas se convierten en tarjetas.
- Botones: alto mínimo 44 px. Principal = fondo `negro` con texto `crema`. Secundario = borde negro. Peligro = borde y texto `peligro`. Mientras se envía, el botón dice "Guardando…" y se desactiva.
- Campos con error: borde de 2 px `peligro` y el mensaje debajo, en rojo.
- Avisos (toasts) arriba a la derecha durante 4 segundos: éxito en negro, error en `error-fondo`.
- Toda lista necesita estado vacío y estado de carga (barras grises).
- Íconos: SVG en línea (trazo 1.8), sin emojis ni librerías de íconos.

## Glosario (usar exactamente estas palabras en la interfaz)

- **Estados del ticket:** Abierto → Asignado → En proceso → Cerrado. Además, **Cancelado** (duplicado, falso o no es de mantenimiento).
- **Activo:** ticket que no está Cerrado ni Cancelado.
- **Sin asignar:** ticket activo sin técnico.
- **Vence:** fecha del reporte + horas objetivo de su categoría.
- **Semáforo** (solo tickets activos): A tiempo = queda más del 25 % del tiempo · Por vencer = 25 % o menos · Vencido = ya pasó la fecha. Siempre con texto, nunca solo color.
- **Quién hace qué:** el admin asigna, reasigna o cancela; el técnico marca En proceso y cierra con foto obligatoria.
- **Regla de reemplazo:** 4 o más fallas en 90 días muestra el aviso en el historial del equipo.
- No existe "prioridad".

## Datos y API

- Todas las llamadas pasan por `src/api/`. Las páginas nunca usan `fetch` directamente.
- `VITE_USE_MOCKS=true` hace que `src/api` devuelva datos de `src/api/mocks/` (con un pequeño retraso para ver el estado de carga). Con `false` llama a `VITE_API_URL`.
- Autenticación: el backend devuelve un JWT al iniciar sesión. Se guarda en `localStorage` y se manda en `Authorization: Bearer <token>`. Si la API responde 401, se cierra la sesión y se va a `/login`.
- Los mocks deben usar la misma forma de datos que el contrato de la API (`docs/api.md` cuando exista).

## Reglas de trabajo

- Una vista a la vez. Antes de crear algo nuevo, revisar si ya existe un componente en `components/ui` o `components/layout` y reutilizarlo.
- Toda la interfaz en español.
- Accesibilidad: `<button>` y `<a>` reales (nunca `onClick` en un `div`), `<label>` en cada campo y `aria-label` en los botones que solo tienen ícono.
- Al terminar cada vista: `npm run lint` y `npm run build` sin errores.
- Commits con Conventional Commits: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`.
