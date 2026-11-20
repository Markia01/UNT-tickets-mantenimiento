import { ErrorApi, json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion, persona } from '@/lib/api/sesion.js'
import { guardarTicket, ticketDoc } from '@/lib/api/tickets.js'

// PATCH /api/tickets/:id/en-proceso (TECNICO asignado) → ticket actualizado (EN_PROCESO)
export const PATCH = manejar(async (request, { params }) => {
  const tecnico = await exigirSesion(request, ['TECNICO'])
  const { id } = await params
  const ticket = await ticketDoc(id)
  if (ticket.tecnico?.id !== String(tecnico._id)) throw new ErrorApi(403, 'Este ticket no está asignado a ti.')
  if (ticket.estado !== 'ASIGNADO') throw new ErrorApi(409, 'Solo un ticket Asignado se puede marcar en proceso.')

  ticket.estado = 'EN_PROCESO'
  ticket.historial.push({ estado: 'EN_PROCESO', usuario: persona(tecnico), comentario: null, fecha: new Date() })
  return json(await guardarTicket(ticket))
})
