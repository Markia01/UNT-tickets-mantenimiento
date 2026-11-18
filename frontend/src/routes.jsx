import { createBrowserRouter } from 'react-router'
import AppLayout from './components/layout/AppLayout.jsx'
import RedirigirInicio from './components/layout/RedirigirInicio.jsx'
import RutaProtegida from './components/layout/RutaProtegida.jsx'
import CambiarContrasena from './pages/auth/CambiarContrasena.jsx'
import Login from './pages/auth/Login.jsx'
import SinPermiso from './pages/errores/SinPermiso.jsx'
import DetalleTicket from './pages/admin/DetalleTicket.jsx'
import Equipos from './pages/admin/Equipos.jsx'
import HistorialEquipo from './pages/admin/HistorialEquipo.jsx'
import Inicio from './pages/admin/Inicio.jsx'
import Tickets from './pages/admin/Tickets.jsx'
import PaginaTemporal from './pages/PaginaTemporal.jsx'

// Ruta con sesión. Cada página pone su propio encabezado con <PageHeader>;
// sin `element` se muestra la página temporal con `nombre` como título.
const vista = (path, nombre, element = <PaginaTemporal nombre={nombre} />) => ({ path, element })

export const router = createBrowserRouter([
  { path: '/', element: <RedirigirInicio /> },

  // Públicas (fuera del layout)
  { path: '/login', element: <Login /> },
  { path: '/cambiar-contrasena', element: <CambiarContrasena /> },
  { path: '/registro', element: <PaginaTemporal nombre="Crear cuenta" pantallaCompleta /> },

  // Con sesión: primero se exige sesión, luego el layout y al final el rol
  {
    element: <RutaProtegida />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: <RutaProtegida roles={['ADMIN']} />,
            children: [
              vista('/admin', 'Inicio', <Inicio />),
              vista('/admin/tickets', 'Tickets', <Tickets />),
              vista('/admin/tickets/:id', 'Detalle del ticket', <DetalleTicket />),
              vista('/admin/equipos', 'Equipos', <Equipos />),
              vista('/admin/equipos/:id', 'Historial del equipo', <HistorialEquipo />),
              vista('/admin/usuarios', 'Usuarios'),
              vista('/admin/categorias', 'Categorías'),
            ],
          },
          {
            element: <RutaProtegida roles={['REPORTANTE']} />,
            children: [
              vista('/reportar', 'Reportar falla'),
              vista('/reportes/:id/enviado', 'Reporte enviado'),
              vista('/mis-reportes', 'Mis reportes'),
            ],
          },
          {
            element: <RutaProtegida roles={['TECNICO']} />,
            children: [
              vista('/tecnico', 'Mis tickets'),
              vista('/tecnico/tickets/:id', 'Atender ticket'),
            ],
          },
        ],
      },
    ],
  },

  // Todos (fuera del layout)
  { path: '/403', element: <SinPermiso /> },
  { path: '*', element: <PaginaTemporal nombre="No encontrado" pantallaCompleta /> },
])
