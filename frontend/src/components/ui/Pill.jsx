import { nombreRol } from '../../utils/usuario.js'
import { ETIQUETA_SEMAFORO } from '../../utils/semaforo.js'
import { ETIQUETA_ESTADO } from '../../utils/ticket.js'

// Semáforo: fondo + punto + texto (nunca solo color)
const SEMAFORO = {
  A_TIEMPO: { caja: 'bg-ok-fondo text-ok-texto', punto: 'bg-ok-punto' },
  POR_VENCER: { caja: 'bg-aviso-fondo text-aviso-texto', punto: 'bg-aviso-punto' },
  VENCIDO: { caja: 'bg-error-fondo text-error-texto', punto: 'bg-error-punto' },
}

// Estados del ticket (guía de estilo): tonos neutros para no confundirse con el semáforo
const ESTADO = {
  ABIERTO: 'border border-negro bg-negro text-crema',
  ASIGNADO: 'border border-borde bg-borde text-negro',
  EN_PROCESO: 'border border-negro text-negro',
  CERRADO: 'border border-borde bg-crema text-texto-2',
  CANCELADO: 'border border-borde bg-crema text-texto-2 line-through',
}

const ROL = {
  ADMIN: 'bg-negro text-crema',
  TECNICO: 'bg-borde text-negro',
  REPORTANTE: 'border border-borde-campo text-texto-2',
}

const BASE = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold'

// <Pill tipo="semaforo" valor="VENCIDO" /> (con children cambia el texto: "Vencido hace 6 h"), <Pill tipo="estado" valor="EN_PROCESO" />,
// <Pill tipo="rol" valor="TECNICO" />, <Pill tipo="neutro">Cerrado en 26 h</Pill>
export default function Pill({ tipo, valor, className = '', children }) {
  if (tipo === 'semaforo') {
    const estilo = SEMAFORO[valor]
    if (!estilo) return null
    return (
      <span className={`${BASE} ${estilo.caja} ${className}`}>
        <span aria-hidden="true" className={`size-1.5 rounded-full ${estilo.punto}`} />
        {children ?? ETIQUETA_SEMAFORO[valor]}
      </span>
    )
  }

  if (tipo === 'estado') {
    return <span className={`${BASE} ${ESTADO[valor] ?? ''} ${className}`}>{ETIQUETA_ESTADO[valor] ?? valor}</span>
  }

  // Etiqueta gris con texto libre, p. ej. "Cerrado en 26 h"
  if (tipo === 'neutro') {
    return <span className={`${BASE} bg-borde text-texto-2 ${className}`}>{children}</span>
  }

  if (tipo === 'rol') {
    return <span className={`${BASE} ${ROL[valor] ?? ''} ${className}`}>{nombreRol(valor)}</span>
  }

  return null
}
