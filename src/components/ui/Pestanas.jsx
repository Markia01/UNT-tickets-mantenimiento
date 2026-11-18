// Botones para cambiar de vista de una lista ("Activos · 8"), con el estilo de la lista de tickets.
// <Pestanas etiqueta="Estado" opciones={[{ valor: 'todos', texto: 'Todos' }]} valor="todos" conteos={{ todos: 3 }} onCambiar={fn} />
// Son botones con aria-pressed: filtran la misma lista, no cambian de página.
// `className` reemplaza el acomodo (por defecto en fila); p. ej. "grid grid-cols-2 sm:flex" en celular.
export default function Pestanas({ etiqueta, opciones, valor, conteos, onCambiar, className = 'flex flex-wrap' }) {
  return (
    <div role="group" aria-label={etiqueta} className={`gap-2 ${className}`}>
      {opciones.map(({ valor: valorOpcion, texto }) => {
        const activa = valor === valorOpcion
        return (
          <button
            key={valorOpcion}
            type="button"
            aria-pressed={activa}
            onClick={() => onCambiar(valorOpcion)}
            className={`min-h-11 rounded-full border px-3 text-sm font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro sm:px-4 ${
              activa ? 'border-negro bg-negro text-crema' : 'border-borde-campo bg-tarjeta hover:bg-campo'
            }`}
          >
            {texto}
            {conteos && conteos[valorOpcion] !== undefined && ` · ${conteos[valorOpcion]}`}
          </button>
        )
      })}
    </div>
  )
}
