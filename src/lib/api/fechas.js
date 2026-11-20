import { ZONA_HORARIA } from './config.js'

// Fechas "de calendario" en hora de Nayarit, sin depender de la zona horaria del servidor.

const formato = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hourCycle: 'h23',
})

// { anio, mes, dia, hora, minuto, segundo } de `fecha` en la zona de Nayarit
function partes(fecha) {
  const p = Object.fromEntries(formato.formatToParts(fecha).map(({ type, value }) => [type, Number(value)]))
  return { anio: p.year, mes: p.month, dia: p.day, hora: p.hour, minuto: p.minute, segundo: p.second }
}

// Diferencia (ms) entre la hora de Nayarit y UTC en ese instante
function desfase(ms) {
  const p = partes(new Date(ms))
  return Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo) - Math.floor(ms / 1000) * 1000
}

// Instante en que empieza ese día (00:00) en Nayarit. Acepta días fuera de rango (dia = 0 → mes anterior).
function medianoche(anio, mes, dia) {
  const comoUtc = Date.UTC(anio, mes - 1, dia)
  const aprox = comoUtc - desfase(comoUtc)
  return new Date(comoUtc - desfase(aprox))
}

// "YYYY-MM-DD" → { desde, hasta } del día completo en Nayarit (hasta = 00:00 del día siguiente), o null
export function rangoDelDia(texto) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? '')
  if (!m) return null
  const [anio, mes, dia] = m.slice(1).map(Number)
  const prueba = new Date(Date.UTC(anio, mes - 1, dia))
  if (prueba.getUTCMonth() !== mes - 1 || prueba.getUTCDate() !== dia) return null
  return { desde: medianoche(anio, mes, dia), hasta: medianoche(anio, mes, dia + 1) }
}

// Lunes 00:00 (hora de Nayarit) de la semana de `ahora`
export function inicioDeSemana(ahora = new Date()) {
  const { anio, mes, dia } = partes(ahora)
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
  return medianoche(anio, mes, dia - ((diaSemana + 6) % 7))
}
