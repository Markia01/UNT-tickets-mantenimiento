export const DOMINIO = '@utnay.edu.mx'

// Solo una parte local sencilla (letras, números, . _ % + -) seguida exactamente de @utnay.edu.mx.
// Así no pasan cosas como "alguien@gmail.com@utnay.edu.mx", "a b@utnay.edu.mx" o "@utnay.edu.mx".
const PATRON = /^[a-z0-9._%+-]+@utnay\.edu\.mx$/

// Normaliza el correo como lo espera la API: sin espacios y en minúsculas
export function limpiarCorreo(correo) {
  return String(correo ?? '').trim().toLowerCase()
}

// true si es un correo institucional válido (ya normalizado o no)
export function esCorreoInstitucional(correo) {
  return PATRON.test(limpiarCorreo(correo))
}

// Mensaje de error del correo institucional, o undefined si es válido
export function errorCorreo(correo) {
  const limpio = limpiarCorreo(correo)
  if (!limpio) return 'Escribe tu correo institucional.'
  if (!limpio.endsWith(DOMINIO)) return `Solo se aceptan correos institucionales ${DOMINIO}`
  if (!PATRON.test(limpio)) return `Escribe un correo válido que termine en ${DOMINIO}`
  return undefined
}
