import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { iniciales, nombreRol } from '../../utils/usuario.js'
import { IconoFlechaAbajo, IconoLlave, IconoMenu } from './iconos.jsx'

const ESTILO_OPCION_MENU =
  'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-negro'

// Desplegable del usuario: correo y "Cambiar contraseña".
// "Cerrar sesión" vive solo en el menú lateral y en el panel del celular.
function MenuUsuario() {
  const { usuario } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const refContenedor = useRef(null)
  const refBoton = useRef(null)

  // Se cierra al hacer clic fuera o con Escape (Escape devuelve el foco al botón)
  useEffect(() => {
    if (!abierto) return
    const alClicFuera = (e) => {
      if (!refContenedor.current?.contains(e.target)) setAbierto(false)
    }
    const alTeclear = (e) => {
      if (e.key === 'Escape') {
        setAbierto(false)
        refBoton.current?.focus()
      }
    }
    document.addEventListener('pointerdown', alClicFuera)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alClicFuera)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  if (!usuario) return null

  return (
    <div ref={refContenedor} className="relative">
      <button
        ref={refBoton}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="menu-usuario"
        className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-left hover:bg-crema/10 focus-visible:outline-2 focus-visible:outline-crema"
      >
        <span className="sr-only sm:not-sr-only">
          <span className="block max-w-48 truncate text-sm font-semibold">{usuario.nombre}</span>
          <span className="block text-xs text-crema/70">{nombreRol(usuario.rol)}</span>
        </span>
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-crema text-sm font-bold text-negro"
        >
          {iniciales(usuario.nombre)}
        </span>
        <IconoFlechaAbajo
          className={`hidden size-4 text-crema/70 transition-transform motion-reduce:transition-none sm:block ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id="menu-usuario"
        hidden={!abierto}
        className="absolute top-full right-0 z-30 mt-2 w-64 rounded-xl border border-borde bg-tarjeta p-2 text-negro shadow-lg"
      >
        <div className="border-b border-borde px-3 pt-2 pb-3">
          <p className="truncate font-semibold sm:hidden">{usuario.nombre}</p>
          <p className="truncate text-xs text-texto-2">{usuario.correo}</p>
        </div>
        <ul className="pt-2">
          <li>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className={`${ESTILO_OPCION_MENU} hover:bg-negro/5`}
            >
              <IconoLlave className="size-[18px]" />
              Cambiar contraseña
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default function Topbar({ titulo, menuMovilAbierto, onAbrirMenuMovil }) {
  return (
    <header className="flex h-[76px] shrink-0 items-center gap-3 bg-negro px-4 text-crema md:px-6">
      <button
        type="button"
        onClick={onAbrirMenuMovil}
        aria-label="Abrir menú"
        aria-expanded={menuMovilAbierto}
        aria-controls="menu-movil"
        className="-ml-1 flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-crema/10 focus-visible:outline-2 focus-visible:outline-crema md:hidden"
      >
        <IconoMenu />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{titulo}</h1>
      <MenuUsuario />
    </header>
  )
}
