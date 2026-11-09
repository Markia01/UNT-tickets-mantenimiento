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
