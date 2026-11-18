'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import Sidebar from './Sidebar.jsx'
import { LayoutContext } from './useLayout.js'

// Layout de todas las pantallas con sesión: menú lateral fijo de 240 px a la
// izquierda y el contenido sobre `fondo`. No hay barra superior: cada página
// pone su encabezado con <PageHeader> (título, ruta de navegación y usuario).
export default function AppLayout({ children }) {
  const { logout } = useAuth()
  const router = useRouter()
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  const cerrarMenuMovil = useCallback(() => setMenuMovilAbierto(false), [])
  const abrirMenuMovil = useCallback(() => setMenuMovilAbierto(true), [])

  const cerrarSesion = useCallback(() => {
    logout()
    router.replace('/login')
  }, [logout, router])

  const contexto = useMemo(() => ({ menuMovilAbierto, abrirMenuMovil }), [menuMovilAbierto, abrirMenuMovil])

  return (
    <LayoutContext.Provider value={contexto}>
      <div className="flex min-h-dvh bg-fondo">
        {/* El menú usa usePathname, que en rutas con [id] espera a conocer la URL */}
        <Suspense fallback={<div className="hidden w-60 shrink-0 bg-negro md:block" />}>
          <Sidebar movilAbierto={menuMovilAbierto} onCerrarMovil={cerrarMenuMovil} onCerrarSesion={cerrarSesion} />
        </Suspense>
        <main className="min-w-0 flex-1 bg-fondo p-4 md:p-8">
          {children}
        </main>
      </div>
    </LayoutContext.Provider>
  )
}
