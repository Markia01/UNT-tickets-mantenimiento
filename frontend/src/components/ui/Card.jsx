// Tarjeta base. Con `titulo` muestra un encabezado (16/600) y, a la derecha,
// `subtitulo` en texto secundario.
export default function Card({ titulo, subtitulo, as: Etiqueta = 'section', className = '', children }) {
  return (
    <Etiqueta className={`rounded-xl border border-borde bg-tarjeta p-5 ${className}`}>
      {titulo && (
        <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-base font-semibold">{titulo}</h2>
          {subtitulo && <p className="text-xs text-texto-2">{subtitulo}</p>}
        </header>
      )}
      {children}
    </Etiqueta>
  )
}
