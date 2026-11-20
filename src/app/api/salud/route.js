import { connection } from 'next/server'
import { conectarDB } from '@/lib/db'

// GET /api/salud — revisa que la app pueda conectarse a MongoDB.
export async function GET() {
  // Que se ejecute en cada petición y no al compilar (npm run build)
  await connection()

  try {
    const { connection: conexion } = await conectarDB()
    return Response.json({ ok: true, baseDeDatos: conexion.name })
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error)
    return Response.json(
      { ok: false, mensaje: 'No se pudo conectar a la base de datos' },
      { status: 503 },
    )
  }
}
