import { CONFIGURACION } from '@/lib/api/config.js'
import { json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'

// GET /api/configuracion (ADMIN) → { reemplazo: { fallas, dias } }
export const GET = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  return json(CONFIGURACION)
})
