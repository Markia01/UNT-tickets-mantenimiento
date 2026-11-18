# Sistema de Tickets de Mantenimiento — UTN

Plataforma web para reportar fallas de infraestructura y equipo en la universidad, dar seguimiento a su atención y conservar el historial de cada equipo.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Node](https://img.shields.io/badge/node-%3E%3D20.9-green)
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
| Aplicación (frontend + API) | Next.js 16 con App Router (JavaScript) |
| Estilos | Tailwind CSS v4 |
| API | Route Handlers de Next.js (`src/app/api/`) |
| Base de datos | MongoDB |
| ODM | Mongoose |
| Fotos | multer |

## Requisitos previos

- [Node.js](https://nodejs.org/) 20.9 o superior (recomendado: 22)
- Una base de datos MongoDB: un clúster gratuito en [MongoDB Atlas](https://www.mongodb.com/atlas) (recomendado) o [MongoDB Community](https://www.mongodb.com/try/download/community) instalado localmente
- Git

## Instalación

El repositorio es un solo proyecto de Next.js: las pantallas y la API viven juntas en `src/`.

```bash
# Clonar el repositorio
git clone https://github.com/<organizacion>/utn-tickets-mantenimiento.git
cd utn-tickets-mantenimiento

# Instalar dependencias (en la raíz)
npm install

# Variables de entorno
cp .env.example .env.local
# NEXT_PUBLIC_USE_MOCKS=true usa datos de prueba; con false llama a la API (/api/...)

# Iniciar en modo desarrollo
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`. Usuarios de prueba (con mocks): `admin@utnay.edu.mx`, `tecnico1@utnay.edu.mx` y `docente@utnay.edu.mx`, contraseña `demo1234`.

> La carpeta `backend/` es el servidor de Express anterior; se mantiene mientras la API se pasa a `src/app/api/`.

## Scripts

Se ejecutan en la raíz.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Inicia Next.js en modo desarrollo con recarga automática |
| `npm run build` | Genera la versión de producción en `.next/` |
| `npm start` | Sirve la versión de producción (después de `npm run build`) |
| `npm run lint` | Revisa el código con ESLint |

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
├── src/
│   ├── app/               # Rutas (App Router): una carpeta por página
│   │   ├── (con-sesion)/  # Pantallas con sesión: admin, reportante y técnico
│   │   ├── login/ …       # Pantallas públicas
│   │   ├── api/           # API (Route Handlers) — backend
│   │   └── globals.css    # Tailwind y colores del proyecto
│   ├── api/               # Cliente del frontend y datos de prueba (mocks/)
│   ├── components/        # Componentes de interfaz (ui/) y de diseño (layout/)
│   ├── context/           # Sesión del usuario
│   ├── hooks/  utils/     # Lógica compartida del frontend
│   ├── models/            # Esquemas de Mongoose — backend
│   └── lib/db.js          # Conexión a MongoDB — backend
├── backend/               # Servidor de Express anterior (en migración a src/app/api)
├── docs/                  # Contrato de la API (api.md) y capturas
└── CLAUDE.md              # Guía del proyecto (estilo, rutas, glosario, quién trabaja dónde)
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
