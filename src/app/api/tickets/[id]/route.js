import { aTicket } from '@/lib/api/formatos.js'
import { ErrorApi, json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'
import { relacion, ticketDoc } from '@/lib/api/tickets.js'

// GET /api/tickets/:id. ADMIN: cualquiera · TECNICO: los asignados a él ·
// REPORTANTE: los que reportó o a los que se sumó
export const GET = manejar(async (request, { params }) => {
  const usuario = await exigirSesion(request)
  const { id } = await params
  const ticket = aTicket((await ticketDoc(id)).toObject())
  const usuarioId = String(usuario._id)

  if (usuario.rol === 'TECNICO' && ticket.tecnico?.id !== usuarioId) {
    throw new ErrorApi(403, 'Este ticket no está asignado a ti.')
  }
  if (usuario.rol === 'REPORTANTE' && !relacion(ticket, usuarioId)) {
    throw new ErrorApi(403, 'No tienes permiso para ver este reporte.')
  }
  return json(ticket)
})
