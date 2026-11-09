import { Navigate } from 'react-router'
import { useAuth } from '../../context/useAuth.js'
import { rutaInicio } from '../../utils/rutaInicio.js'

// "/" manda a la pantalla de inicio del rol, o al login si no hay sesión
export default function RedirigirInicio() {
  const { rol } = useAuth()
  return <Navigate to={rutaInicio(rol)} replace />
}
