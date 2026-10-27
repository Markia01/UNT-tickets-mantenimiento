# Sistema de Tickets de Mantenimiento — UTN

Plataforma web para reportar fallas de infraestructura y equipo en la universidad, dar seguimiento a su atención y conservar el historial de cada equipo.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Node](https://img.shields.io/badge/node-%3E%3D20-green)
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
| Servidor | Node.js + Express |
| Base de datos | MongoDB |
| ODM | Mongoose |
| Vistas | EJS + Bootstrap 5 |
| Fotos | multer |

## Requisitos previos

- [Node.js](https://nodejs.org/) 20 o superior
- Una base de datos MongoDB: un clúster gratuito en [MongoDB Atlas](https://www.mongodb.com/atlas) (recomendado) o [MongoDB Community](https://www.mongodb.com/try/download/community) instalado localmente
- Git

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/<organizacion>/utn-tickets-mantenimiento.git
cd utn-tickets-mantenimiento

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y poner la cadena de conexión en MONGODB_URI

# 4. Iniciar en modo desarrollo
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Scripts

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
├── src/
│   ├── config/        # Conexión a MongoDB
│   ├── models/        # Esquemas de Mongoose
│   ├── routes/        # Rutas por módulo
│   ├── controllers/   # Lógica de cada ruta
│   ├── middlewares/   # Autenticación y permisos por rol
│   ├── services/      # cálculo de vencimientos
│   ├── views/         # Plantillas EJS
│   └── app.js         # Punto de entrada
├── public/            # Archivos estáticos (CSS, imágenes)
├── uploads/           # Fotos subidas (no se versiona)
└── docs/              # Documentación y capturas
```

## Cómo contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de tu primer cambio.

## Equipo — El Dream Team

| Integrante | Rol |
| --- | --- |
| Nombre | Líder técnico / backend |
| Nombre | Base de datos y datos |
| Nombre | Frontend |
| Nombre | Calidad, despliegue y exposición |

Proyecto académico de la Universidad Tecnológica de Nayarit, 2026.

## Licencia

Distribuido bajo la licencia MIT. Ver [LICENSE](LICENSE).
