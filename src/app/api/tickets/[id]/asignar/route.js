import { Usuario } from '@/models/index.js'
import { ErrorApi, esObjectId, json, leerJson, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion, persona } from '@/lib/api/sesion.js'
import { esActivo, guardarTicket, ticketDoc } from '@/lib/api/tickets.js'

// PATCH /api/tickets/:id/asignar { tecnicoId } (ADMIN) → ticket actualizado (ASIGNADO)
export const PATCH = manejar(async (request, { params }) => {
  const admin = await exigirSesion(request, ['ADMIN'])
  const { id } = await params
  const cuerpo = await leerJson(request)
  const ticket = await ticketDoc(id)
  if (!esActivo(ticket)) throw new ErrorApi(409, 'Este ticket ya no está activo; no se puede asignar.')

  const tecnicoId = String(cuerpo.tecnicoId ?? '')
  const tecnico = esObjectId(tecnicoId)
    ? await Usuario.findOne({ _id: tecnicoId, rol: 'TECNICO', activo: true })
    : null
  if (!tecnico) throw new ErrorApi(400, 'Elige un técnico válido.')
  if (ticket.tecnico?.id === tecnicoId) throw new ErrorApi(400, 'El ticket ya está asignado a ese técnico.')

  const anterior = ticket.tecnico
  ticket.tecnico = persona(tecnico)
  ticket.estado = 'ASIGNADO'
  ticket.historial.push({
    estado: 'ASIGNADO',
    usuario: persona(admin),
    tecnico: persona(tecnico),
    comentario: anterior?.id ? `Reasignado; antes lo tenía ${anterior.nombre}.` : null,
    fecha: new Date(),
  })
  return json(await guardarTicket(ticket))
})
