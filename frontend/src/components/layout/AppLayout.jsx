import { useCallback, useEffect, useState } from 'react'
import { Outlet, useMatches, useNavigate } from 'react-router'
import { useAuth } from '../../context/useAuth.js'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const CLAVE_CONTRAIDO = 'menuContraido'

function leerContraido() {
  try {
    return localStorage.getItem(CLAVE_CONTRAIDO) === 'true'
  } catch {
    return false
  }
}

// Layout de todas las pantallas con sesión. El nombre de la vista sale del
// `handle.titulo` de la ruta (ver routes.jsx).
export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const matches = useMatches()
  // `handle.titulo` puede ser texto o una función de los parámetros: (params) => `Ticket #${params.id}`
  const ruta = matches.findLast((m) => m.handle?.titulo)
  const titulo =
    typeof ruta?.handle.titulo === 'function' ? ruta.handle.titulo(ruta.params) : (ruta?.handle.titulo ?? '')

  const [contraido, setContraido] = useState(leerContraido)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_CONTRAIDO, String(contraido))
    } catch {
      // Sin acceso a localStorage: el menú simplemente no recuerda su estado
    }
  }, [contraido])

  useEffect(() => {
    document.title = titulo ? `${titulo} · Tickets de Mantenimiento UTN` : 'Tickets de Mantenimiento UTN'
  }, [titulo])

  const cerrarMenuMovil = useCallback(() => setMenuMovilAbierto(false), [])

  const cerrarSesion = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return (
    <div className="flex h-dvh overflow-hidden bg-fondo">
      <Sidebar
        contraido={contraido}
        onAlternarContraido={() => setContraido((v) => !v)}
        movilAbierto={menuMovilAbierto}
        onCerrarMovil={cerrarMenuMovil}
        onCerrarSesion={cerrarSesion}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          titulo={titulo}
          menuMovilAbierto={menuMovilAbierto}
          onAbrirMenuMovil={() => setMenuMovilAbierto(true)}
        />
        <main className="flex-1 overflow-y-auto bg-fondo p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
