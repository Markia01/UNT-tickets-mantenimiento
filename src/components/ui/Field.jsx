// Campo de formulario: etiqueta, input y mensaje de error debajo.
// `accesorio` es un elemento opcional que se coloca a la derecha dentro del input
// (por ejemplo, el botón Mostrar/Ocultar de la contraseña).
export default function Field({ id, label, error, accesorio, className = '', ...props }) {
  const idError = `${id}-error`

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-texto-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
          className={`block min-h-12 w-full rounded-lg bg-campo px-3.5 text-base text-negro placeholder:text-texto-2/80 focus:outline-2 focus:outline-offset-1 focus:outline-negro ${
            error ? 'border-2 border-peligro' : 'border border-borde-campo'
          } ${accesorio ? 'pr-24' : ''}`}
          {...props}
        />
        {accesorio && (
          <div className="absolute inset-y-0 right-2 flex items-center">{accesorio}</div>
        )}
      </div>
      {error && (
        <p id={idError} className="mt-1.5 text-xs font-semibold text-peligro">
          {error}
        </p>
      )}
    </div>
  )
}
