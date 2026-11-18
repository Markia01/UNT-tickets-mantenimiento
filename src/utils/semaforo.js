// Semáforo de un ticket activo (ver glosario en CLAUDE.md):
//   A tiempo   = queda más del 25 % del tiempo
//   Por vencer = queda el 25 % o menos
//   Vencido    = ya pasó la fecha de vencimiento
// Cerrado y Cancelado no tienen semáforo (null).

export const SEMAFORO = {
  A_TIEMPO: 'A_TIEMPO',
  POR_VENCER: 'POR_VENCER',
  VENCIDO: 'VENCIDO',
}

export const ETIQUETA_SEMAFORO = {
  A_TIEMPO: 'A tiempo',
  POR_VENCER: 'Por vencer',
  VENCIDO: 'Vencido',
}

const ESTADOS_TERMINADOS = new Set(['CERRADO', 'CANCELADO'])

// Activo = ni Cerrado ni Cancelado
export function esActivo(ticket) {
  return !ESTADOS_TERMINADOS.has(ticket.estado)
}

export function calcularSemaforo(ticket, ahora = new Date()) {
  if (!ticket || !esActivo(ticket)) return null

  const creado = new Date(ticket.creadoEn).getTime()
  const vence = new Date(ticket.venceEn).getTime()
  const momento = new Date(ahora).getTime()
  if (Number.isNaN(creado) || Number.isNaN(vence)) return null

  const restante = vence - momento
  if (restante <= 0) return SEMAFORO.VENCIDO

  const total = vence - creado
  if (total <= 0 || restante <= total * 0.25) return SEMAFORO.POR_VENCER
  return SEMAFORO.A_TIEMPO
}

// Orden de urgencia: Vencido, luego Por vencer, luego A tiempo
export const ORDEN_URGENCIA = { VENCIDO: 0, POR_VENCER: 1, A_TIEMPO: 2 }
