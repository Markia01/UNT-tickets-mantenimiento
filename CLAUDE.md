# Sistema de tickets de mantenimiento UTN

Este archivo le da contexto a Claude Code. Va en la raíz del repositorio.

## Qué es

Aplicación web para reportar fallas de aulas y equipos de la Universidad Tecnológica de Nayarit y dar seguimiento a su atención. Es **un solo proyecto de Next.js** con el frontend (pantallas) y el backend (API en Route Handlers) juntos. Mientras la API no esté lista, el frontend funciona con datos de prueba (mocks).

## Stack

- Next.js 16 con **App Router**, en **JavaScript** (sin TypeScript). Alias `@/*` → `src/*`.
- Tailwind CSS v4, con los colores del proyecto definidos en `src/app/globals.css` (`@theme`)
- ESLint con `eslint-config-next`
- Navegación: `Link` de `next/link`; `useRouter`, `usePathname`, `useSearchParams` y `useParams` de `next/navigation`
- Backend: API en `src/app/api/` con MongoDB y Mongoose
- No usar Bootstrap ni librerías de componentes. No instalar dependencias nuevas sin preguntar.
- Esta versión de Next tiene cambios importantes: antes de usar una API de Next, revisar la guía en `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Quién trabaja dónde

| Parte | Carpetas | Responsable |
| --- | --- | --- |
| Frontend | `src/app/` (excepto `src/app/api/`), `src/components/`, `src/context/`, `src/hooks/`, `src/api/` (cliente y mocks), `src/utils/` | Frontend |
| Backend | `src/app/api/` (Route Handlers), `src/models/` (esquemas de Mongoose), `src/lib/db.js` (conexión a MongoDB) | Backend (Fernando) |
| Compartido | `docs/api.md` (contrato de la API) | Ambos |

- El frontend **no** crea ni edita nada en `src/app/api/`, `src/models/` ni `src/lib/db.js`.
- `backend/` es el servidor de Express anterior; se mantiene hasta que el backend termine de pasarse a `src/app/api/`.
- `src/api/` (sin `app`) es el **cliente** del frontend; la API real está en `src/app/api/`.

## Estructura

```
src/
├── app/                        # Rutas (App Router): una carpeta por página
│   ├── layout.js               # Layout raíz: <html>, globals.css y Providers
│   ├── Providers.jsx           # AuthProvider + ToastProvider ("use client")
│   ├── globals.css             # Tailwind + @theme con los colores
│   ├── icon.svg                # Ícono de la pestaña
│   ├── page.jsx                # "/" → manda al inicio del rol o a /login
│   ├── login/  registro/  cambiar-contrasena/   # Públicas
│   ├── 403/page.jsx            # Sin permiso
│   ├── not-found.jsx           # 404
│   ├── (con-sesion)/           # Grupo de rutas: exige sesión y pone AppLayout
│   │   ├── layout.jsx
│   │   ├── admin/              # layout.jsx exige ADMIN
│   │   │   ├── page.jsx        # Inicio
│   │   │   ├── tickets/        # page.jsx (lista) y [id]/ (detalle, con _componentes/)
│   │   │   ├── equipos/        # page.jsx (lista), [id]/ (historial) y _componentes/
│   │   │   ├── usuarios/  categorias/
│   │   ├── (reportante)/       # layout.jsx exige REPORTANTE
│   │   │   ├── reportar/  mis-reportes/  reportes/[id]/enviado/
│   │   └── tecnico/            # layout.jsx exige TECNICO; page.jsx y tickets/[id]/
│   └── api/                    # BACKEND (Route Handlers) — no lo toca el frontend
├── api/                        # Cliente del frontend
│   ├── cliente.js              # fetch a /api/... con el token JWT (o a los mocks)
│   ├── auth.js  admin.js  tickets.js  equipos.js   # una función por endpoint
│   └── mocks/                  # datos de prueba con la misma forma que la API
├── components/
│   ├── ui/                     # Button, Pill, Card, Field, CampoContrasena, Modal, Toast, EmptyState, Skeleton...
│   └── layout/                 # AppLayout, Sidebar (menú por rol), PageHeader, PantallaAuth,
│                               # RutaProtegida, PaginaTemporal, CargandoPagina
├── context/
│   ├── AuthContext.jsx         # usuario actual, rol, token, login y logout
│   └── sesionGuardada.js       # sesión en localStorage (useSyncExternalStore)
├── hooks/                      # useDatos, useFiltrosUrl, useTextoDiferido
├── utils/                      # fechas, semáforo, correo, rutaInicio, volverALista...
├── models/                     # BACKEND
└── lib/db.js                   # BACKEND
```

- Las carpetas que empiezan con `_` (`_componentes/`) son privadas: Next no las convierte en rutas. Ahí van las piezas que solo usa esa página.
- Las carpetas entre paréntesis (`(con-sesion)`, `(reportante)`) agrupan rutas sin cambiar la URL.

## Rutas y roles

| Ruta | Archivo | Pantalla | Rol |
| --- | --- | --- | --- |
| `/login` | `app/login/page.jsx` | Iniciar sesión | público |
| `/registro` | `app/registro/page.jsx` | Crear cuenta (temporal) | público |
| `/cambiar-contrasena` | `app/cambiar-contrasena/page.jsx` | Cambiar contraseña (correo, actual y nueva) | público |
| `/admin` | `(con-sesion)/admin/page.jsx` | Inicio (resumen) | ADMIN |
| `/admin/tickets` | `(con-sesion)/admin/tickets/page.jsx` | Lista de tickets | ADMIN |
| `/admin/tickets/[id]` | `(con-sesion)/admin/tickets/[id]/page.jsx` | Detalle del ticket | ADMIN |
| `/admin/equipos` | `(con-sesion)/admin/equipos/page.jsx` | Equipos | ADMIN |
| `/admin/equipos/[id]` | `(con-sesion)/admin/equipos/[id]/page.jsx` | Historial del equipo | ADMIN |
| `/admin/usuarios` | `(con-sesion)/admin/usuarios/page.jsx` | Usuarios (temporal) | ADMIN |
| `/admin/categorias` | `(con-sesion)/admin/categorias/page.jsx` | Categorías y regla de reemplazo (temporal) | ADMIN |
| `/reportar` | `(con-sesion)/(reportante)/reportar/page.jsx` | Reportar falla (temporal) | REPORTANTE |
| `/reportes/[id]/enviado` | `(con-sesion)/(reportante)/reportes/[id]/enviado/page.jsx` | Reporte enviado (temporal) | REPORTANTE |
| `/mis-reportes` | `(con-sesion)/(reportante)/mis-reportes/page.jsx` | Mis reportes (temporal) | REPORTANTE |
| `/tecnico` | `(con-sesion)/tecnico/page.jsx` | Mis tickets (temporal) | TECNICO |
| `/tecnico/tickets/[id]` | `(con-sesion)/tecnico/tickets/[id]/page.jsx` | Atender y cerrar (temporal) | TECNICO |
| `/403` | `app/403/page.jsx` | Sin permiso | todos |
| cualquier otra | `app/not-found.jsx` | No encontrado (404) | todos |

Las pantallas "temporales" usan `<PaginaTemporal nombre="…" />` hasta que se hagan.

Después de iniciar sesión se redirige según el rol: ADMIN → `/admin`, TECNICO → `/tecnico`, REPORTANTE → `/reportar`. Si un rol entra a una ruta que no es suya, va a `/403`.


### Protección por rol

- `RutaProtegida` (`components/layout/RutaProtegida.jsx`) revisa el `AuthContext`: sin sesión manda a `/login`; con otro rol, a `/403`. La usan `(con-sesion)/layout.jsx` (solo exige sesión) y el `layout.jsx` de cada sección (`roles={['ADMIN']}`, etc.).
- La sesión vive en `localStorage`, que no existe en el servidor. Por eso las pantallas con sesión se dibujan solo en el navegador: mientras no se ha leído la sesión (`listo` es `false`) `RutaProtegida` no muestra nada. En `next.config.mjs` la validación de "navegación instantánea" está en `manual-warning` por esta razón.

### Reglas de Next para las páginas

- `'use client'` arriba de todo componente o página que use estado, efectos, contexto (`useAuth`, `useToast`), eventos o hooks de `next/navigation`.
- Las páginas que usan `useSearchParams` (por ejemplo vía `useFiltrosUrl`) o `useParams` exportan un componente que las envuelve en `<Suspense fallback={<CargandoPagina />}>`; si no, falla `npm run build`.
- El título de la pestaña se pone con un `<title>` dentro del componente (ya lo hacen `PageHeader`, `PantallaAuth` y `PaginaTemporal`). No usar `document.title`, porque Next lo reemplaza.
- Next no tiene el `state` de React Router: para que el detalle regrese a la lista con los mismos filtros se usa `utils/volverALista.js` (sessionStorage).

## Guía de estilo (negro y crema)

Usar siempre estos nombres de Tailwind, nunca colores sueltos:

| Token | Valor | Uso |
| --- | --- | --- |
| `negro` | #111111 | Menú lateral, botón principal, botón ☰ del celular, encabezado de tablas |
| `fondo` | #EFE7D6 | Fondo de la página y del encabezado de cada página; líneas entre filas de las tablas |
| `tarjeta` | #FFFDF8 | Tarjetas, tablas y formularios; fondo de pestañas y botones secundarios no activos |
| `crema` | #F3EBDA | Texto sobre negro, opción activa del menú |
| `borde` | #DDD3BF | Bordes de tarjetas |
| `borde-campo` | #CFC4AD | Bordes de inputs |
| `campo` | #F7F2E8 | Fondo de inputs |
| `texto-2` | #5C5547 | Texto secundario y etiquetas |
| `peligro` | #A3231A | Errores y acciones destructivas |
| `ok-fondo` / `ok-texto` / `ok-punto` | #D6EBD9 / #1E5E33 / #2E8B4E | Semáforo "A tiempo" |
| `aviso-fondo` / `aviso-texto` / `aviso-punto` | #F5E3BC / #6E4300 / #D99A1E | Semáforo "Por vencer" |
| `error-fondo` / `error-texto` / `error-punto` | #F6D9D3 / #8A1C12 / #C8372D | Semáforo "Vencido" |

- Tipografía: `system-ui`. Título de página 28/700 (22 en celular), título de tarjeta 16/600, texto 14, etiquetas de campo 12/600 en `texto-2`.
- Bordes redondeados: 8 px en botones y campos, 12 px en tarjetas, completos en etiquetas (pills).
- Layout con sesión: **sin barra superior**. Menú lateral negro de 240 px, siempre visible y fijo a la altura de la ventana (`sticky`, no se contrae); arriba solo el recuadro del logo. El contenido va sobre `fondo`.
- Encabezado de página: cada página lo pone con `<PageHeader titulo ruta etiquetas />`, sobre `fondo` y sin borde. A la izquierda el título (28/700, negro), con la ruta de navegación opcional arriba (“Tickets / #14”) y etiquetas opcionales al lado (en el detalle: “#14 · Aire acondicionado” + estado + semáforo). A la derecha, solo texto: nombre del usuario (600) y su rol debajo (12, `texto-2`). Sin menú desplegable.
- En celular: el encabezado sigue sobre `fondo` con un botón ☰ negro (44 px, esquinas de 10 px) y el título; el ☰ abre el panel del menú con la tarjeta del usuario arriba. Las tablas se convierten en tarjetas.
- Tablas: encabezado negro; líneas entre filas en `fondo`.
- Botones: alto mínimo 44 px. Principal = fondo `negro` con texto `crema`. Secundario = borde negro sobre `tarjeta`. Peligro = borde y texto `peligro`. Mientras se envía, el botón dice "Guardando…" y se desactiva.
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
- La API está en la misma app: las rutas empiezan con `/api` (por ejemplo `getTickets()` llama a `GET /api/tickets`, que atiende `src/app/api/tickets/route.js`). Contrato completo en `docs/api.md`.
- `NEXT_PUBLIC_USE_MOCKS=true` (en `.env.local`) hace que `src/api` devuelva datos de `src/api/mocks/` (con un pequeño retraso para ver el estado de carga). Con `false` llama a `/api/...`. Las variables que lee el navegador deben empezar con `NEXT_PUBLIC_`.
- Autenticación: el backend devuelve un JWT al iniciar sesión. Se guarda en `localStorage` y se manda en `Authorization: Bearer <token>`. Si la API responde 401, se cierra la sesión y se va a `/login`.
- Los mocks deben usar las mismas rutas y forma de datos que el contrato de la API (`docs/api.md`).

## Reglas de trabajo

- Una vista a la vez. Antes de crear algo nuevo, revisar si ya existe un componente en `components/ui` o `components/layout` y reutilizarlo.
- Toda la interfaz en español.
- Accesibilidad: `<button>` y `<a>` reales (nunca `onClick` en un `div`), `<label>` en cada campo y `aria-label` en los botones que solo tienen ícono.
- Al terminar cada vista: `npm run lint` y `npm run build` (en la raíz) sin errores.
- Commits con Conventional Commits: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`.
