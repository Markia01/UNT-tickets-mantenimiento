import { createBrowserRouter } from 'react-router'
import AppLayout from './components/layout/AppLayout.jsx'
import RedirigirInicio from './components/layout/RedirigirInicio.jsx'
import RutaProtegida from './components/layout/RutaProtegida.jsx'
import Login from './pages/auth/Login.jsx'
import SinPermiso from './pages/errores/SinPermiso.jsx'
import PaginaTemporal from './pages/PaginaTemporal.jsx'

// Ruta con sesión: `titulo` es el nombre que muestra la barra superior
const vista = (path, titulo) => ({
  path,
  handle: { titulo },
  element: <PaginaTemporal nombre={titulo} />,
})

export const router = createBrowserRouter([
  { path: '/', element: <RedirigirInicio /> },

  // Públicas (fuera del layout)
  { path: '/login', element: <Login /> },
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
              vista('/admin', 'Inicio'),
              vista('/admin/tickets', 'Tickets'),
              vista('/admin/tickets/:id', 'Detalle del ticket'),
              vista('/admin/equipos', 'Equipos'),
              vista('/admin/equipos/:id', 'Historial del equipo'),
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
