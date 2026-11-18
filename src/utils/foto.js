// Reglas de las fotos (reporte y cierre). Las comparten la pantalla y los mocks;
// el backend debe aplicar las mismas (ver docs/api.md).
export const MAX_FOTO_MB = 5
export const MAX_FOTO_BYTES = MAX_FOTO_MB * 1024 * 1024

// Mensaje de error de un archivo de foto, o undefined si es válido
export function errorFoto(archivo) {
  if (!archivo) return undefined
  if (!archivo.type?.startsWith('image/')) return 'El archivo debe ser una imagen (JPG, PNG, HEIC…).'
  if (archivo.size > MAX_FOTO_BYTES) return `La foto pesa más de ${MAX_FOTO_MB} MB. Toma otra o elige una más ligera.`
  return undefined
}

// ¿Viene un archivo de verdad? (un input vacío manda un File de 0 bytes sin nombre)
export function hayArchivo(valor) {
  return typeof File !== 'undefined' && valor instanceof File && valor.size > 0
}
