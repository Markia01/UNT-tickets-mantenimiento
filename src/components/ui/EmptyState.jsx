// Estado vacío de una lista: ícono opcional, título, mensaje y acción opcional
export default function EmptyState({ icono, titulo, mensaje, accion, className = '' }) {
  return (
    <div className={`flex flex-col items-center px-4 py-8 text-center ${className}`}>
      {icono && (
        <div aria-hidden="true" className="mb-3 flex size-12 items-center justify-center rounded-full bg-crema text-texto-2">
          {icono}
        </div>
      )}
      <p className="text-base font-semibold">{titulo}</p>
      {mensaje && <p className="mt-1 max-w-sm text-texto-2">{mensaje}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}
