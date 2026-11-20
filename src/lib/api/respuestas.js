import mongoose from 'mongoose'
import { connection } from 'next/server'
import { conectarDB } from '@/lib/db.js'

// Error con código HTTP. Se lanza desde cualquier parte de un manejador y
// `manejar` lo convierte en { mensaje, ...extra } con ese status.
export class ErrorApi extends Error {
  constructor(status, mensaje, extra = {}) {
    super(mensaje)
    this.status = status
    this.extra = extra
  }
}

export const json = (datos, status = 200) => Response.json(datos, { status })

// Envuelve un Route Handler: conecta a MongoDB y traduce los errores a la forma del contrato
export function manejar(manejador) {
  return async (request, contexto) => {
    // Que se ejecute en cada petición y nunca al compilar (npm run build no toca la base)
    await connection()
    try {
      await conectarDB()
    } catch (error) {
      // URI mal escrita, IP no permitida en Atlas, sin internet...
      console.error('No se pudo conectar con MongoDB:', error.message)
      return json({ mensaje: 'No se pudo conectar con la base de datos. Inténtalo más tarde.' }, 503)
    }
    try {
      return await manejador(request, contexto)
    } catch (error) {
      if (error instanceof ErrorApi) return json({ mensaje: error.message, ...error.extra }, error.status)
      if (error instanceof mongoose.Error.MongooseServerSelectionError || error?.name === 'MongoServerSelectionError') {
        console.error('Se perdió la conexión con MongoDB:', error.message)
        return json({ mensaje: 'No se pudo conectar con la base de datos. Inténtalo más tarde.' }, 503)
      }
      console.error(error)
      return json({ mensaje: 'Ocurrió un error en el servidor. Inténtalo de nuevo.' }, 500)
    }
  }
}

// Cuerpo JSON de la petición ({} si viene vacío); 400 si no es JSON válido
export async function leerJson(request) {
  const texto = await request.text()
  if (!texto) return {}
  try {
    const datos = JSON.parse(texto)
    return datos && typeof datos === 'object' ? datos : {}
  } catch {
    throw new ErrorApi(400, 'Los datos enviados no son válidos.')
  }
}

// Campos de un formulario multipart/form-data; 400 si no lo es
export async function leerFormulario(request) {
  try {
    return await request.formData()
  } catch {
    throw new ErrorApi(400, 'Los datos enviados no son válidos.')
  }
}

// Parámetros de la URL (?vista=activos) como objeto
export const consultaDe = (request) => Object.fromEntries(request.nextUrl.searchParams)

// "Cómputo" ≈ "computo": sin acentos, en minúsculas y sin espacios en los extremos
export const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

// Recorta los extremos y deja un solo espacio entre palabras
export const limpiarEspacios = (texto) => String(texto ?? '').trim().replace(/\s+/g, ' ')

export const esObjectId = (id) => mongoose.isValidObjectId(id) && String(new mongoose.Types.ObjectId(id)) === id
