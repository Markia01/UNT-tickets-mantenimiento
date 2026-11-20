import { errorFoto, hayArchivo } from '@/utils/foto.js'
import { Foto } from '@/models/index.js'
import { ErrorApi } from './respuestas.js'

// Revisa la foto (solo imágenes, máximo 5 MB, como en la pantalla). Devuelve el archivo o null.
export function validarFoto(valor, { obligatoria = false, mensajeFalta } = {}) {
  if (!hayArchivo(valor)) {
    if (obligatoria) throw new ErrorApi(400, mensajeFalta)
    return null
  }
  const problema = errorFoto(valor)
  if (problema) throw new ErrorApi(400, problema)
  // Un SVG puede llevar código; como las fotos se sirven desde este mismo dominio, no se aceptan
  if (valor.type.includes('svg')) throw new ErrorApi(400, 'El archivo debe ser una imagen (JPG, PNG, HEIC…).')
  return valor
}

// Guarda la foto en la colección "fotos" y devuelve la URL con la que se muestra
export async function guardarFoto(archivo) {
  const datos = Buffer.from(await archivo.arrayBuffer())
  const foto = await Foto.create({ tipoContenido: archivo.type, datos, tamano: datos.length })
  return `/api/fotos/${foto._id}`
}
