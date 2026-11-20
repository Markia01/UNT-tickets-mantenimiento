import { ErrorApi, consultaDe, json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'
import { activoDeEquipo, equipoDoc } from '@/lib/api/tickets.js'

// GET /api/tickets/activo?equipoId= (REPORTANTE) → { ticket: Ticket | null }
export const GET = manejar(async (request) => {
  await exigirSesion(request, ['REPORTANTE'])
  const { equipoId } = consultaDe(request)
  if (!equipoId) throw new ErrorApi(400, 'Falta el equipo.')
  const equipo = await equipoDoc(equipoId)
  return json({ ticket: await activoDeEquipo(equipo._id) })
})
