import { useEffect, useId, useRef } from 'react'
import { IconoCerrar } from '../layout/iconos.jsx'

const POSICIONES = {
  // Centrado (confirmaciones, formularios cortos)
  centro: 'm-auto w-[calc(100%-2rem)] max-w-lg rounded-xl',
  // Panel que sube desde abajo (filtros en celular)
  abajo: 'mx-0 mt-auto mb-0 w-full max-w-none rounded-t-xl',
}

// Ventana modal con <dialog> nativo: atrapa el foco, se cierra con Escape,
// con la X o tocando el fondo, y devuelve el foco al botón que la abrió.
export default function Modal({ abierto, onCerrar, titulo, pie, posicion = 'centro', className = '', children }) {
  const refDialogo = useRef(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = refDialogo.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={refDialogo}
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      // El clic en el fondo (::backdrop) llega al propio <dialog>; el contenido
      // ocupa todo el cuadro, así que un clic dentro nunca tiene al dialog como destino.
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      className={`max-h-[85dvh] overflow-hidden border border-borde bg-tarjeta p-0 text-negro backdrop:bg-negro/60 ${POSICIONES[posicion]} ${className}`}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-borde py-2 pr-2 pl-5">
          <h2 id={idTitulo} className="text-base font-semibold">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex size-11 items-center justify-center rounded-lg hover:bg-negro/5 focus-visible:outline-2 focus-visible:outline-negro"
          >
            <IconoCerrar />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {pie && <footer className="flex shrink-0 gap-3 border-t border-borde p-4">{pie}</footer>}
      </div>
    </dialog>
  )
}
