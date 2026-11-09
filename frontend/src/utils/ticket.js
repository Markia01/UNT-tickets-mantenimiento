export const ETIQUETA_ESTADO = {
  ABIERTO: 'Abierto',
  ASIGNADO: 'Asignado',
  EN_PROCESO: 'En proceso',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
}

// "Edificio B · Aula 3"
export function formatearUbicacion(ubicacion) {
  if (!ubicacion) return ''
  return [ubicacion.edificio, ubicacion.aula].filter(Boolean).join(' · ')
}
