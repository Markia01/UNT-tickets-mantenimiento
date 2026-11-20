import mongoose from 'mongoose'
import { MODELOS } from '@/models/index.js'

// Conexión a MongoDB (Atlas o local) que comparten todos los Route Handlers.
//
// En desarrollo Next recarga los módulos con cada cambio; si conectáramos cada vez se
// abrirían conexiones nuevas sin cerrar las anteriores. Por eso la conexión (y la
// promesa mientras se abre) se guarda en `globalThis` y se reutiliza.
const cache = globalThis.mongooseCache ?? { conexion: null, promesa: null }
globalThis.mongooseCache = cache

export async function conectarDB() {
  if (cache.conexion) return cache.conexion

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Falta la variable MONGODB_URI en el archivo .env.local')
  }

  if (!cache.promesa) {
    cache.promesa = mongoose.connect(uri, {
      // Si la base no responde, falla en 10 s en lugar de dejar la petición colgada
      serverSelectionTimeoutMS: 10000,
    })
  }

  try {
    const conexion = await cache.promesa
    // Crea las colecciones (usuarios, categorias, equipos, tickets, contadores, fotos) y sus
    // índices si todavía no existen. Sin esto, MongoDB solo crea una colección al guardar
    // su primer documento.
    await Promise.all(MODELOS.map((modelo) => modelo.init()))
    cache.conexion = conexion
  } catch (error) {
    // Si falló, que el siguiente intento vuelva a conectar
    cache.promesa = null
    throw error
  }

  return cache.conexion
}
