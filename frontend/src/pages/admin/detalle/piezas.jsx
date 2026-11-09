import { useState } from 'react'
import Pill from '../../../components/ui/Pill.jsx'
import { formatearDuracion } from '../../../utils/fechas.js'
import { calcularSemaforo, ETIQUETA_SEMAFORO } from '../../../utils/semaforo.js'

// Un dato de la tarjeta "Información": etiqueta arriba (12/600) y valor en negritas
export function Dato({ etiqueta, children, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-xs text-texto-2">{etiqueta}</dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  )
}

// Foto del ticket. Sin `src` muestra un recuadro punteado con `textoVacio`;
// si la imagen no carga, lo indica en lugar de mostrar el ícono roto.
export function Foto({ src, alt, etiqueta, textoVacio = 'Sin foto' }) {
  const [fallo, setFallo] = useState(false)
  const [srcAnterior, setSrcAnterior] = useState(src)
  if (src !== srcAnterior) {
    setSrcAnterior(src)
    setFallo(false)
  }

  return (
    <figure>
      <figcaption className="mb-1.5 text-xs text-texto-2">{etiqueta}</figcaption>
      {src && !fallo ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFallo(true)}
          className="aspect-[4/3] w-full rounded-lg border border-borde bg-borde object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-borde-campo bg-fondo/60 p-4 text-center text-texto-2">
          {src ? 'No se pudo cargar la foto' : textoVacio}
        </div>
      )}
    </figure>
  )
}

// Etiqueta de tiempo del encabezado:
//   activos   → "Vencido hace 6 h" / "Por vencer · quedan 2 h" / "A tiempo · quedan 30 h"
//   cerrados  → "Atendido en 26 h · dentro del objetivo de 48 h" (o "fuera del objetivo")
//   cancelado → nada
export function PillTiempo({ ticket, ahora }) {
  if (ticket.estado === 'CANCELADO') return null

  if (ticket.estado === 'CERRADO') {
    const dentro = new Date(ticket.cerradoEn) <= new Date(ticket.venceEn)
    return (
      <Pill tipo="semaforo" valor={dentro ? 'A_TIEMPO' : 'VENCIDO'}>
        Atendido en {formatearDuracion(ticket.creadoEn, ticket.cerradoEn)} · {dentro ? 'dentro' : 'fuera'} del objetivo
        de {ticket.categoria.horasObjetivo} h
      </Pill>
    )
  }

  const semaforo = calcularSemaforo(ticket, ahora)
  if (!semaforo) return null
  const texto =
    semaforo === 'VENCIDO'
      ? `Vencido hace ${formatearDuracion(ticket.venceEn, ahora)}`
      : `${ETIQUETA_SEMAFORO[semaforo]} · quedan ${formatearDuracion(ahora, ticket.venceEn)}`
  return (
    <Pill tipo="semaforo" valor={semaforo}>
      {texto}
    </Pill>
  )
}

export const ESTILO_ENLACE =
  'inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro'
