export const DOMINIO = '@utnay.edu.mx'

// Normaliza el correo como lo espera la API: sin espacios y en minúsculas
export function limpiarCorreo(correo) {
  return correo.trim().toLowerCase()
}

// Mensaje de error del correo institucional, o undefined si es válido
export function errorCorreo(correo) {
  const limpio = limpiarCorreo(correo)
  if (!limpio) return 'Escribe tu correo institucional.'
  if (!limpio.endsWith(DOMINIO) || limpio.length <= DOMINIO.length) return `El correo debe terminar en ${DOMINIO}`
  return undefined
}
