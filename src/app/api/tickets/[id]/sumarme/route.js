import { ErrorApi, json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion, persona } from '@/lib/api/sesion.js'
import { esActivo, guardarTicket, relacion, ticketDoc } from '@/lib/api/tickets.js'

// POST /api/tickets/:id/sumarme (REPORTANTE) → el usuario se agrega a `sumados`
export const POST = manejar(async (request, { params }) => {
  const usuario = await exigirSesion(request, ['REPORTANTE'])
  const { id } = await params
  const ticket = await ticketDoc(id)

  if (!esActivo(ticket)) throw new ErrorApi(409, 'Este reporte ya no está activo; si la falla sigue, repórtala de nuevo.')
  const yaEsta = relacion(ticket, String(usuario._id))
  if (yaEsta === 'PROPIO') throw new ErrorApi(409, 'Tú hiciste este reporte.')
  if (yaEsta === 'SUMADO') throw new ErrorApi(409, 'Ya te sumaste a este reporte.')

  ticket.sumados.push(persona(usuario))
  return json(await guardarTicket(ticket))
})
