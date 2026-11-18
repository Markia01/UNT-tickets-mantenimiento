// Lista desplegable con etiqueta, con el mismo estilo que Field.
export default function Select({ id, label, error, className = '', children, ...props }) {
  const idError = `${id}-error`

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-texto-2">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className={`block min-h-12 w-full rounded-lg bg-campo px-3 text-base text-negro focus:outline-2 focus:outline-offset-1 focus:outline-negro disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? 'border-2 border-peligro' : 'border border-borde-campo'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={idError} className="mt-1.5 text-xs font-semibold text-peligro">
          {error}
        </p>
      )}
    </div>
  )
}
