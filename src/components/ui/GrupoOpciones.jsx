// Opciones excluyentes como botones grandes (radio nativos, fáciles de tocar en celular).
// <GrupoOpciones nombre="tipo" leyenda="Soy" opciones={['Alumno', 'Docente']} valor={tipo} onChange={setTipo} error="…" />
// `opciones` acepta textos o { valor, texto }.
export default function GrupoOpciones({ nombre, leyenda, opciones, valor, onChange, error, className = '' }) {
  const idError = `${nombre}-error`

  return (
    <fieldset
      className={className}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? idError : undefined}
    >
      <legend className="mb-1.5 block text-xs font-semibold text-texto-2">{leyenda}</legend>
      <div className="grid grid-cols-3 gap-2">
        {opciones.map((opcion) => {
          const { valor: valorOpcion, texto } = typeof opcion === 'string' ? { valor: opcion, texto: opcion } : opcion
          const elegida = valor === valorOpcion
          return (
            <label
              key={valorOpcion}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg px-2 text-center font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-negro ${
                elegida
                  ? 'border border-negro bg-negro text-crema'
                  : `bg-campo text-negro hover:bg-tarjeta ${error ? 'border-2 border-peligro' : 'border border-borde-campo'}`
              }`}
            >
              <input
                type="radio"
                name={nombre}
                value={valorOpcion}
                checked={elegida}
                onChange={() => onChange(valorOpcion)}
                className="sr-only"
              />
              {texto}
            </label>
          )
        })}
      </div>
      {error && (
        <p id={idError} className="mt-1.5 text-xs font-semibold text-peligro">
          {error}
        </p>
      )}
    </fieldset>
  )
}
