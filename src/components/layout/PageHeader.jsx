'use client'

import Link from 'next/link'
import { useAuth } from '../../context/useAuth.js'
import { nombreRol } from '../../utils/usuario.js'
import { IconoMenu } from './iconos.jsx'
import { useLayout } from './useLayout.js'

const TITULO_APP = 'Tickets de Mantenimiento UTN'

// Encabezado de cada página con sesión, sobre el color `fondo` y sin borde.
// - `titulo`: texto del <h1> (también se usa en el título de la pestaña).
// - `ruta` (opcional): ruta de navegación arriba del título,
//   p. ej. [{ texto: 'Tickets', a: '/admin/tickets' }, { texto: '#14' }]; el último es la página actual.
// - `etiquetas` (opcional): pills junto al título (estado, semáforo…).
// - `refTitulo` (opcional): ref del <h1> para devolverle el foco (tiene tabIndex -1).
// En escritorio muestra a la derecha el nombre y el rol del usuario; en celular, el botón ☰.
export default function PageHeader({ titulo, ruta, etiquetas, refTitulo }) {
  const { usuario } = useAuth()
  const layout = useLayout()

  return (
    <header className="mb-6 flex items-center gap-4">
      {/* React lo sube al <head>; con document.title, Next lo volvía a reemplazar */}
      <title>{titulo ? `${titulo} · ${TITULO_APP}` : TITULO_APP}</title>
      <div className="min-w-0 flex-1">
        {ruta?.length > 0 && (
          <nav aria-label="Ruta de navegación" className="mb-2">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-texto-2">
              {ruta.map((paso, i) => {
                const actual = i === ruta.length - 1
                return (
                  <li key={`${paso.texto}-${i}`} aria-current={actual ? 'page' : undefined}>
                    {i > 0 && <span aria-hidden="true">/ </span>}
                    {paso.a && !actual ? (
                      <Link
                        href={paso.a}
                        className="text-negro underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro"
                      >
                        {paso.texto}
                      </Link>
                    ) : (
                      paso.texto
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            {layout && (
              <button
                type="button"
                onClick={layout.abrirMenuMovil}
                aria-label="Abrir menú"
                aria-expanded={layout.menuMovilAbierto}
                aria-controls="menu-movil"
                className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-negro text-crema hover:bg-negro/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro md:hidden"
              >
                <IconoMenu />
              </button>
            )}
            <h1
              ref={refTitulo}
              tabIndex={refTitulo ? -1 : undefined}
              className="min-w-0 text-[22px] leading-tight font-bold break-words text-negro focus:outline-none md:text-[28px]"
            >
              {titulo}
            </h1>
          </div>
          {etiquetas && <div className="flex flex-wrap items-center gap-2">{etiquetas}</div>}
        </div>
      </div>

      {usuario && (
        <div className="hidden max-w-60 shrink-0 text-right md:block">
          <p className="truncate font-semibold">{usuario.nombre}</p>
          <p className="text-xs text-texto-2">{nombreRol(usuario.rol)}</p>
        </div>
      )}
    </header>
  )
}
