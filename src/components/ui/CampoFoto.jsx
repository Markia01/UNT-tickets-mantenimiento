'use client'

import { useRef } from 'react'
import { errorFoto, MAX_FOTO_MB } from '@/utils/foto.js'
import { IconoCamara } from '../layout/iconos.jsx'

const ESTILO_BOTON =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-negro bg-tarjeta px-4 text-base font-semibold text-negro hover:bg-negro/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-negro'

// Foto con vista previa. En celular el navegador ofrece tomarla con la cámara o elegirla de la galería.
// - `valor`: { archivo: File, vista: dataURL } | null
// - `onChange(valor, error)`: con un archivo válido llega `valor`; si no es imagen o pesa más
//   de 5 MB llega `null` y el mensaje de error. Al quitarla llega (null, undefined).
// - `obligatoria`: solo cambia el texto de ayuda; la página decide si deja enviar sin foto.
export default function CampoFoto({ id, label, valor, onChange, error, obligatoria = false, className = '' }) {
  const refInput = useRef(null)
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`

  function elegir(evento) {
    const archivo = evento.target.files?.[0]
    // Se limpia para poder volver a elegir el mismo archivo después de quitarlo
    evento.target.value = ''
    if (!archivo) return

    const problema = errorFoto(archivo)
    if (problema) {
      onChange(null, problema)
      return
    }
    const lector = new FileReader()
    lector.onload = () => onChange({ archivo, vista: lector.result }, undefined)
    lector.onerror = () => onChange(null, 'No se pudo leer la foto. Inténtalo con otra.')
    lector.readAsDataURL(archivo)
  }

  function quitar() {
    onChange(null, undefined)
    refInput.current?.focus()
  }

  const input = (
    <input
      ref={refInput}
      id={id}
      type="file"
      accept="image/*"
      onChange={elegir}
      aria-describedby={`${idAyuda}${error ? ` ${idError}` : ''}`}
      aria-invalid={error ? true : undefined}
      className="sr-only"
    />
  )

  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-semibold text-texto-2">{label}</p>

      {valor ? (
        <div className="space-y-3">
          {/* Vista previa local (data URL): next/image no aplica */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={valor.vista}
            alt="Vista previa de la foto elegida"
            className="aspect-[4/3] w-full rounded-lg border border-borde bg-borde object-cover"
          />
          <p className="truncate text-xs text-texto-2">{valor.archivo.name}</p>
          <div className="flex flex-wrap gap-2">
            <label className={ESTILO_BOTON}>
              {input}
              Cambiar foto
            </label>
            <button
              type="button"
              onClick={quitar}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-peligro px-4 text-base font-semibold text-peligro hover:bg-peligro/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro"
            >
              Quitar foto
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-dashed bg-campo p-4 text-center hover:bg-tarjeta has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-negro ${
            error ? 'border-2 border-peligro' : 'border-2 border-borde-campo'
          }`}
        >
          {input}
          <IconoCamara className="size-7 text-texto-2" />
          <span className="font-semibold">Tomar o elegir foto</span>
          <span className="text-xs text-texto-2">Se abre la cámara o tu galería</span>
        </label>
      )}

      <p id={idAyuda} className="mt-1.5 text-xs text-texto-2">
        {obligatoria ? 'Obligatoria.' : 'Opcional.'} Solo imágenes, máximo {MAX_FOTO_MB} MB.
      </p>
      {error && (
        <p id={idError} className="mt-1 text-xs font-semibold text-peligro">
          {error}
        </p>
      )}
    </div>
  )
}
