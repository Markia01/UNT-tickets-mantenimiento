const VARIANTES = {
  principal: 'bg-negro text-crema border border-negro hover:bg-negro/90',
  secundario: 'bg-transparent text-negro border border-negro hover:bg-negro/5',
  peligro: 'bg-transparent text-peligro border border-peligro hover:bg-peligro/5',
  // Solo para confirmar una acción destructiva dentro de ConfirmDialog
  peligroLleno: 'bg-peligro text-crema border border-peligro hover:bg-peligro/90',
}

// Botón base. Mientras `cargando` es true muestra el texto de carga y se desactiva.
export default function Button({
  variante = 'principal',
  cargando = false,
  textoCargando = 'Guardando…',
  type = 'button',
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {cargando ? textoCargando : children}
    </button>
  )
}
