// Valores fijos del sistema que usa la API.

// Edificios que se pueden elegir al dar de alta un equipo. GET /api/catalogos devuelve estos
// más cualquier otro que ya tenga un equipo guardado. Ajusta la lista a los edificios reales.
export const EDIFICIOS = ['Edificio A', 'Edificio B', 'Edificio C']

export const TIPOS_EQUIPO = [
  'Aire acondicionado',
  'Computadora',
  'Contacto eléctrico',
  'Instalación hidráulica',
  'Luminaria',
  'Pizarrón',
  'Proyector',
]

// Regla de reemplazo: `fallas` o más fallas en los últimos `dias` días
export const CONFIGURACION = { reemplazo: { fallas: 4, dias: 90 } }

// Zona horaria de Nayarit, para los filtros por día y "cerrados esta semana"
export const ZONA_HORARIA = 'America/Mazatlan'

export const HORA_MS = 60 * 60 * 1000
export const DIA_MS = 24 * HORA_MS
