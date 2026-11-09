import { useEffect, useId, useRef } from 'react'
import { IconoCerrar } from '../layout/iconos.jsx'

const POSICIONES = {
  // Centrado (confirmaciones, formularios cortos)
  centro: 'm-auto w-[calc(100%-2rem)] max-w-lg rounded-xl',
  // Panel que sube desde abajo (filtros en celular)
  abajo: 'mx-0 mt-auto mb-0 w-full max-w-none rounded-t-xl',
}

// Ventana modal con <dialog> nativo y showModal(): el navegador atrapa el foco,
// vuelve inerte el resto de la página, la cierra con Escape y devuelve el foco
// al botón que la abrió. Además se cierra con la X o con clic en el fondo.
//
// - `bloqueado`: mientras se guarda, no se puede cerrar (ni Escape, ni fondo, ni X).
// - El foco inicial va al elemento con `data-autofocus` si existe; si no, al primero enfocable.
export default function Modal({
  abierto,
  onCerrar,
  titulo,
  pie,
  posicion = 'centro',
  bloqueado = false,
  conCerrar = true,
  className = '',
  children,
}) {
  const refDialogo = useRef(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = refDialogo.current
    if (!dialogo) return
    if (abierto && !dialogo.open) {
      dialogo.showModal()
      dialogo.querySelector('[data-autofocus]')?.focus()
    }
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  const cerrar = () => {
    if (!bloqueado) onCerrar()
  }

  return (
    <dialog
      ref={refDialogo}
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
      // Escape dispara "cancel": se impide mientras está bloqueado
      onCancel={(e) => {
        e.preventDefault()
        cerrar()
      }}
      // Respaldo: algunos navegadores cierran con un segundo Escape aunque se haya
      // impedido; así el estado de React no queda desincronizado.
      onClose={() => abierto && onCerrar()}
      // El clic en el fondo (::backdrop) llega al propio <dialog>; el contenido
      // ocupa todo el cuadro, así que un clic dentro nunca tiene al dialog como destino.
      onClick={(e) => e.target === e.currentTarget && cerrar()}
      className={`max-h-[85dvh] overflow-hidden border border-borde bg-tarjeta p-0 text-negro backdrop:bg-negro/60 ${POSICIONES[posicion]} ${className}`}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header
          className={`flex shrink-0 items-center justify-between gap-3 ${
            conCerrar ? 'border-b border-borde py-2 pr-2 pl-5' : 'px-6 pt-6'
          }`}
        >
          <h2 id={idTitulo} className="text-lg font-semibold">
            {titulo}
          </h2>
          {conCerrar && (
            <button
              type="button"
              onClick={cerrar}
              disabled={bloqueado}
              aria-label="Cerrar"
              className="flex size-11 items-center justify-center rounded-lg hover:bg-negro/5 focus-visible:outline-2 focus-visible:outline-negro disabled:opacity-50"
            >
              <IconoCerrar />
            </button>
          )}
        </header>
        <div className={`min-h-0 flex-1 overflow-y-auto ${conCerrar ? 'p-5' : 'px-6 pt-2 pb-4'}`}>{children}</div>
        {pie && (
          <footer
            className={`flex shrink-0 gap-3 ${conCerrar ? 'border-t border-borde p-4' : 'justify-end px-6 pb-6'}`}
          >
            {pie}
          </footer>
        )}
      </div>
    </dialog>
  )
}
