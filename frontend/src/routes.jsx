import { createBrowserRouter } from 'react-router'
import RedirigirInicio from './components/layout/RedirigirInicio.jsx'
import RutaProtegida from './components/layout/RutaProtegida.jsx'
import Login from './pages/auth/Login.jsx'
import SinPermiso from './pages/errores/SinPermiso.jsx'
import PaginaTemporal from './pages/PaginaTemporal.jsx'

const temporal = (nombre) => <PaginaTemporal nombre={nombre} />

export const router = createBrowserRouter([
  { path: '/', element: <RedirigirInicio /> },

  // Públicas
  { path: '/login', element: <Login /> },
  { path: '/registro', element: temporal('Crear cuenta') },

  // ADMIN
  {
    element: <RutaProtegida roles={['ADMIN']} />,
    children: [
      { path: '/admin', element: temporal('Inicio') },
      { path: '/admin/tickets', element: temporal('Lista de tickets') },
      { path: '/admin/tickets/:id', element: temporal('Detalle del ticket') },
      { path: '/admin/equipos', element: temporal('Equipos') },
      { path: '/admin/equipos/:id', element: temporal('Historial del equipo') },
      { path: '/admin/usuarios', element: temporal('Usuarios') },
      { path: '/admin/categorias', element: temporal('Categorías y regla de reemplazo') },
    ],
  },

  // REPORTANTE
  {
    element: <RutaProtegida roles={['REPORTANTE']} />,
    children: [
      { path: '/reportar', element: temporal('Reportar falla') },
      { path: '/reportes/:id/enviado', element: temporal('Reporte enviado') },
      { path: '/mis-reportes', element: temporal('Mis reportes') },
    ],
  },

  // TECNICO
  {
    element: <RutaProtegida roles={['TECNICO']} />,
    children: [
      { path: '/tecnico', element: temporal('Mis tickets') },
      { path: '/tecnico/tickets/:id', element: temporal('Atender y cerrar') },
    ],
  },

  // Todos
  { path: '/403', element: <SinPermiso /> },
  { path: '*', element: temporal('No encontrado') },
])
