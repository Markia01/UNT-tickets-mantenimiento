# Sistema de Tickets de Mantenimiento — UTN

Plataforma web para reportar fallas de infraestructura y equipo en la universidad, dar seguimiento a su atención y conservar el historial de cada equipo.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Node](https://img.shields.io/badge/node-%3E%3D22.22-green)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)

## Problema

Hoy las fallas en aulas y equipos (aires acondicionados, proyectores, computadoras) se reportan de palabra. No queda registro, los reportes se duplican o se pierden y no existe un historial que ayude a decidir qué reparar o reemplazar.

## Funcionalidades

- **Seguimiento del ticket**: Abierto → Asignado → En proceso → Cerrado.
- **Evidencia fotográfica**: foto obligatoria al cerrar un ticket.
- **Tiempos objetivo** por categoría de falla, con semáforo (a tiempo, por vencer, vencido).
- **Historial por equipo**: todas sus fallas, tiempos de atención y técnicos.
- **Roles**: Reportante, Técnico y Administrador.

## Capturas

> Se agregarán conforme avance el desarrollo (carpeta `docs/capturas`).

## Tecnologías

| Parte | Tecnología |
| --- | --- |
| Frontend | React + Vite (JavaScript) |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Rutas del frontend | React Router |
| Servidor (API) | Node.js + Express |
| Base de datos | MongoDB |
| ODM | Mongoose |
| Fotos | multer |

## Requisitos previos

- [Node.js](https://nodejs.org/) 22.22 o superior (lo pide React Router)
- Una base de datos MongoDB: un clúster gratuito en [MongoDB Atlas](https://www.mongodb.com/atlas) (recomendado) o [MongoDB Community](https://www.mongodb.com/try/download/community) instalado localmente
- Git

## Instalación

El repositorio tiene dos proyectos independientes, cada uno con su propio `package.json`: `frontend/` y `backend/`.

```bash
# Clonar el repositorio
git clone https://github.com/<organizacion>/utn-tickets-mantenimiento.git
cd utn-tickets-mantenimiento
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_USE_MOCKS=true usa datos de prueba; con false llama a VITE_API_URL
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env y poner la cadena de conexión en MONGODB_URI
npm run dev
```

El backend queda disponible en `http://localhost:3000`.

## Scripts

Se ejecutan dentro de la carpeta correspondiente.

**frontend/**

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Inicia Vite con recarga automática |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente la versión de producción |
| `npm run lint` | Revisa el código con Oxlint |

**backend/**

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Inicia el servidor y lo reinicia al guardar cambios |
| `npm start` | Inicia el servidor en modo producción |
| `npm run lint` | Revisa el estilo del código con ESLint |
| `npm run format` | Da formato al código con Prettier |

Para ver y editar los datos se recomienda [MongoDB Compass](https://www.mongodb.com/products/tools/compass).

## Modelo de datos

| Colección | Contenido |
| --- | --- |
| `usuarios` | Nombre, correo, contraseña cifrada y rol |
| `equipos` | Tipo, descripción, ubicación (edificio y aula)  |
| `categorias` | Tipo de falla y sus horas objetivo de atención |
| `tickets` | Falla reportada, referencias a equipo, categoría y usuarios, fotos, fechas y el historial de cambios de estado |

## Estructura del proyecto

```
├── frontend/              # Interfaz web (React + Vite + Tailwind)
│   ├── src/
│   │   ├── api/           # Llamadas a la API y datos de prueba (mocks/)
│   │   ├── components/    # Componentes de interfaz (ui/) y de diseño (layout/)
│   │   ├── context/       # Sesión del usuario
│   │   ├── pages/         # Pantallas por rol: auth, admin, reportante, tecnico, errores
│   │   ├── routes.jsx     # Rutas de la aplicación
│   │   └── index.css      # Tailwind y colores del proyecto
│   └── CLAUDE.md          # Guía del frontend (estilo, rutas, glosario)
├── backend/               # API (Node + Express + MongoDB)
│   ├── src/
│   │   ├── config/        # Conexión a MongoDB
│   │   ├── models/        # Esquemas de Mongoose
│   │   ├── routes/        # Rutas por módulo
│   │   ├── controllers/   # Lógica de cada ruta
│   │   ├── middlewares/   # Autenticación y permisos por rol
│   │   ├── services/      # Cálculo de vencimientos
│   │   ├── views/         # Plantillas EJS
│   │   └── app.js         # Punto de entrada
│   ├── public/            # Archivos estáticos (CSS, imágenes)
│   └── uploads/           # Fotos subidas (no se versiona)
└── docs/                  # Documentación y capturas
```

## Cómo contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de tu primer cambio.

## Equipo — El Dream Team

| Integrante | Rol |
| --- | --- |
| Garcia Martinez Ari Daniel | Líder técnico / backend |
| Arce Armenta Fernando De Jesus | Base de datos y datos |
| Ximena Monserrat | Frontend |
| Valles-Ambriz Angeles | Calidad, despliegue y exposición |

Proyecto académico de la Universidad Tecnológica de Nayarit, 2026.

## Licencia

Distribuido bajo la licencia MIT. Ver [LICENSE](LICENSE).
