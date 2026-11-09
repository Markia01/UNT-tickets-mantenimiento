import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from '../../context/useAuth.js'
import { iniciales, nombreRol } from '../../utils/usuario.js'
import {
  IconoCategorias,
  IconoCerrar,
  IconoCerrarSesion,
  IconoEquipos,
  IconoHerramienta,
  IconoInicio,
  IconoLista,
  IconoMenu,
  IconoReportar,
  IconoTickets,
  IconoUsuarios,
} from './iconos.jsx'

// `end` evita que "Inicio" (/admin) quede activo dentro de /admin/tickets, etc.
const OPCIONES_POR_ROL = {
  ADMIN: [
    { a: '/admin', texto: 'Inicio', Icono: IconoInicio, end: true },
    { a: '/admin/tickets', texto: 'Tickets', Icono: IconoTickets },
    { a: '/admin/equipos', texto: 'Equipos', Icono: IconoEquipos },
    { a: '/admin/usuarios', texto: 'Usuarios', Icono: IconoUsuarios },
    { a: '/admin/categorias', texto: 'Categorías', Icono: IconoCategorias },
  ],
  TECNICO: [{ a: '/tecnico', texto: 'Mis tickets', Icono: IconoHerramienta }],
  REPORTANTE: [
    { a: '/reportar', texto: 'Reportar falla', Icono: IconoReportar },
    { a: '/mis-reportes', texto: 'Mis reportes', Icono: IconoLista },
  ],
}

const ESTILO_OPCION =
  'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema'

function Logo() {
  return (
    <div className="flex h-11 flex-1 items-center justify-center rounded-lg border border-dashed border-crema/50 text-xs font-semibold tracking-widest text-crema/70">
      LOGO
    </div>
  )
}

// Opciones del menú y "Cerrar sesión". La comparten el menú de escritorio y el panel de celular.
function ContenidoMenu({ contraido = false, onElegir, onCerrarSesion }) {
  const { rol } = useAuth()
  const opciones = OPCIONES_POR_ROL[rol] ?? []

  return (
    <>
      {/* min-h-0 permite que la lista se encoja y tenga su propio scroll;
          sin él, un flex item no baja de la altura de su contenido y empuja el pie fuera */}
      <nav aria-label="Menú principal" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {opciones.map(({ a, texto, Icono, end }) => (
            <li key={a}>
              <NavLink
                to={a}
                end={end}
                onClick={onElegir}
                title={contraido ? texto : undefined}
                className={({ isActive }) =>
                  `${ESTILO_OPCION} ${contraido ? 'justify-center' : ''} ${
                    isActive
                      ? 'bg-crema font-bold text-negro'
                      : 'text-crema/70 hover:bg-crema/10 hover:text-crema'
                  }`
                }
              >
                <Icono />
                <span className={contraido ? 'sr-only' : 'truncate'}>{texto}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 px-3 pb-4">
        <button
          type="button"
          onClick={onCerrarSesion}
          title={contraido ? 'Cerrar sesión' : undefined}
          className={`${ESTILO_OPCION} w-full text-crema/70 hover:bg-crema/10 hover:text-crema ${
            contraido ? 'justify-center' : ''
          }`}
        >
          <IconoCerrarSesion />
          <span className={contraido ? 'sr-only' : ''}>Cerrar sesión</span>
        </button>
        <p
          className={`mt-3 border-t border-crema/15 pt-3 text-xs text-crema/50 ${
            contraido ? 'text-center' : 'px-3'
          }`}
        >
          {contraido ? (
            <>
              UTN
              <br />
              2026
            </>
          ) : (
            'UTN · 2026'
          )}
        </p>
      </div>
    </>
  )
}

// Panel deslizable para celular. Usa <dialog> nativo: atrapa el foco, se cierra
// con Escape y devuelve el foco al botón ☰ al cerrarse.
function PanelMovil({ abierto, onCerrar, onCerrarSesion }) {
  const { usuario } = useAuth()
  const refDialogo = useRef(null)

  useEffect(() => {
    const dialogo = refDialogo.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  // Si la pantalla crece a escritorio con el panel abierto, se cierra
  useEffect(() => {
    if (!abierto) return
    const consulta = window.matchMedia('(min-width: 768px)')
    const alCambiar = (e) => e.matches && onCerrar()
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [abierto, onCerrar])

  return (
    <dialog
      ref={refDialogo}
      id="menu-movil"
      aria-label="Menú"
      onClose={onCerrar}
      // El clic en el fondo oscuro (::backdrop) llega al propio <dialog>; el contenido
      // ocupa todo el panel, así que un clic dentro nunca tiene al dialog como destino.
      // Con teclado se cierra con Escape (nativo) o con el botón X.
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[280px] max-w-[85vw] overflow-hidden bg-negro p-0 text-crema backdrop:bg-negro/60 md:hidden"
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center gap-3 px-3 pt-4">
          <Logo />
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="flex size-11 items-center justify-center rounded-lg text-crema hover:bg-crema/10 focus-visible:outline-2 focus-visible:outline-crema"
          >
            <IconoCerrar />
          </button>
        </div>

        {usuario && (
          <div className="mx-3 mt-4 flex shrink-0 items-center gap-3 rounded-xl bg-crema/10 p-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-crema text-sm font-bold text-negro"
            >
              {iniciales(usuario.nombre)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{usuario.nombre}</p>
              <p className="text-xs text-crema/70">{nombreRol(usuario.rol)}</p>
            </div>
          </div>
        )}

        <ContenidoMenu onElegir={onCerrar} onCerrarSesion={onCerrarSesion} />
      </div>
    </dialog>
  )
}

export default function Sidebar({
  contraido,
  onAlternarContraido,
  movilAbierto,
  onCerrarMovil,
  onCerrarSesion,
}) {
  return (
    <>
      <aside
        id="menu-lateral"
        className={`sticky top-0 hidden h-dvh max-h-dvh shrink-0 flex-col overflow-hidden bg-negro text-crema transition-[width] duration-200 motion-reduce:transition-none md:flex ${
          contraido ? 'w-[72px]' : 'w-60'
        }`}
      >
        <div className="flex shrink-0 items-center gap-3 px-3 pt-4">
          {!contraido && <Logo />}
          <button
            type="button"
            onClick={onAlternarContraido}
            aria-label={contraido ? 'Expandir menú' : 'Contraer menú'}
            aria-expanded={!contraido}
            aria-controls="menu-lateral"
            title={contraido ? 'Expandir menú' : 'Contraer menú'}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-crema hover:bg-crema/10 focus-visible:outline-2 focus-visible:outline-crema"
          >
            <IconoMenu />
          </button>
        </div>
        <ContenidoMenu contraido={contraido} onCerrarSesion={onCerrarSesion} />
      </aside>

      <PanelMovil abierto={movilAbierto} onCerrar={onCerrarMovil} onCerrarSesion={onCerrarSesion} />
    </>
  )
}
