import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../context/useAuth.js'

// Sin sesión → /login. Con sesión pero con otro rol → /403.
export default function RutaProtegida({ roles }) {
  const { usuario, rol } = useAuth()
  const location = useLocation()

  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (roles && !roles.includes(rol)) return <Navigate to="/403" replace />
  return <Outlet />
}
