import { useCallback, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useAuth } from '../../context/useAuth.js'
import Sidebar from './Sidebar.jsx'
import { LayoutContext } from './useLayout.js'

// Layout de todas las pantallas con sesión: menú lateral fijo de 240 px a la
// izquierda y el contenido sobre `fondo`. No hay barra superior: cada página
// pone su encabezado con <PageHeader> (título, ruta de navegación y usuario).
export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  const cerrarMenuMovil = useCallback(() => setMenuMovilAbierto(false), [])
  const abrirMenuMovil = useCallback(() => setMenuMovilAbierto(true), [])

  const cerrarSesion = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const contexto = useMemo(() => ({ menuMovilAbierto, abrirMenuMovil }), [menuMovilAbierto, abrirMenuMovil])

  return (
    <LayoutContext.Provider value={contexto}>
      <div className="flex min-h-dvh bg-fondo">
        <Sidebar movilAbierto={menuMovilAbierto} onCerrarMovil={cerrarMenuMovil} onCerrarSesion={cerrarSesion} />
        <main className="min-w-0 flex-1 bg-fondo p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </LayoutContext.Provider>
  )
}
