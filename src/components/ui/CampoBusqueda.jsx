import { IconoBuscar } from '../layout/iconos.jsx'

// Campo de búsqueda con lupa. Con `etiquetaSoloEscritorio` la etiqueta se oculta
// visualmente en celular (sigue disponible para lectores de pantalla).
export default function CampoBusqueda({ id, label, etiquetaSoloEscritorio = false, className = '', ...props }) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={
          etiquetaSoloEscritorio
            ? 'sr-only md:not-sr-only md:mb-1.5 md:block md:text-xs md:font-semibold md:text-texto-2'
            : 'mb-1.5 block text-xs font-semibold text-texto-2'
        }
      >
        {label}
      </label>
      <div className="relative">
        <IconoBuscar className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-texto-2" />
        <input
          id={id}
          type="search"
          autoComplete="off"
          className="block min-h-12 w-full rounded-lg border border-borde-campo bg-campo pr-3 pl-10 text-base text-negro placeholder:text-texto-2/80 focus:outline-2 focus:outline-offset-1 focus:outline-negro"
          {...props}
        />
      </div>
    </div>
  )
}
