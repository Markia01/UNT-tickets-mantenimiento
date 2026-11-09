const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const UN_DIA_MS = 24 * 60 * 60 * 1000

const dosDigitos = (n) => String(n).padStart(2, '0')

function inicioDelDia(fecha) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

// "08:30"
export function formatearHora(fecha) {
  const d = new Date(fecha)
  return `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`
}

// Fecha corta relativa a `ahora`, en hora local:
//   "hoy 08:30", "ayer 16:20", "mañana 09:00", "2 nov 10:05", "28 dic 2025 10:05"
export function formatearFecha(fecha, ahora = new Date()) {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''

  const dias = Math.round((inicioDelDia(d) - inicioDelDia(ahora)) / UN_DIA_MS)
  const hora = formatearHora(d)
  if (dias === 0) return `hoy ${hora}`
  if (dias === -1) return `ayer ${hora}`
  if (dias === 1) return `mañana ${hora}`

  const anio = d.getFullYear() !== new Date(ahora).getFullYear() ? ` ${d.getFullYear()}` : ''
  return `${d.getDate()} ${MESES[d.getMonth()]}${anio} ${hora}`
}

// Igual que formatearFecha pero con mayúscula inicial, para inicio de renglón: "Hoy 08:30"
export function formatearFechaInicio(fecha, ahora = new Date()) {
  const texto = formatearFecha(fecha, ahora)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Lunes 00:00 (hora local) de la semana de `ahora`
export function inicioDeSemana(ahora = new Date()) {
  const d = inicioDelDia(ahora)
  const diasDesdeLunes = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diasDesdeLunes)
  return d
}

// Fecha local en formato "YYYY-MM-DD" (el que usan <input type="date"> y la URL)
export function fechaISOLocal(fecha) {
  const d = new Date(fecha)
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`
}

// "YYYY-MM-DD" → Date a las 00:00 locales de ese día (null si no es válida)
export function parsearFechaLocal(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? '')
  if (!partes) return null
  const [, anio, mes, dia] = partes.map(Number)
  const d = new Date(anio, mes - 1, dia)
  return d.getMonth() === mes - 1 ? d : null
}

// Duración entre dos fechas: "45 min", "26 h", "3 d"
export function formatearDuracion(desde, hasta) {
  const minutos = Math.max(0, Math.round((new Date(hasta) - new Date(desde)) / 60000))
  if (minutos < 60) return `${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 48) return `${horas} h`
  return `${Math.round(horas / 24)} d`
}

// "2 nov 2026, 09:12"
export function formatearFechaCompleta(fecha) {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${formatearHora(d)}`
}

// "20 oct, 09:30" (con año solo si no es el de `ahora`: "20 oct 2025, 09:30")
export function formatearFechaCorta(fecha, ahora = new Date()) {
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''
  const anio = d.getFullYear() !== new Date(ahora).getFullYear() ? ` ${d.getFullYear()}` : ''
  return `${d.getDate()} ${MESES[d.getMonth()]}${anio}, ${formatearHora(d)}`
}
