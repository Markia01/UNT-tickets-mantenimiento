// Texto de varias líneas con etiqueta, contador de caracteres y error, con el estilo de Field.
// `minimo` solo se usa para el texto de ayuda; la validación la hace la página.
export default function AreaTexto({ id, label, error, value = '', maximo, minimo, ayuda, className = '', ...props }) {
  const idError = `${id}-error`
  const idAyuda = `${id}-ayuda`
  const largo = value.trim().length
  const textoAyuda = ayuda ?? (minimo ? `Mínimo ${minimo} caracteres.` : null)

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-texto-2">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={maximo}
        aria-invalid={error ? true : undefined}
        aria-describedby={[textoAyuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined}
        className={`block min-h-32 w-full rounded-lg bg-campo px-3.5 py-3 text-base text-negro placeholder:text-texto-2/80 focus:outline-2 focus:outline-offset-1 focus:outline-negro ${
          error ? 'border-2 border-peligro' : 'border border-borde-campo'
        }`}
        {...props}
      />
      <div className="mt-1.5 flex justify-between gap-3 text-xs text-texto-2">
        <p id={idAyuda}>{textoAyuda}</p>
        {maximo && (
          <p aria-hidden="true" className="shrink-0 tabular-nums">
            {largo}/{maximo}
          </p>
        )}
      </div>
      {error && (
        <p id={idError} className="mt-1 text-xs font-semibold text-peligro">
          {error}
        </p>
      )}
    </div>
  )
}
