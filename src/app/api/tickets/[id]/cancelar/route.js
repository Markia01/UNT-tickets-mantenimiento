import { ErrorApi, json, leerJson, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion, persona } from '@/lib/api/sesion.js'
import { esActivo, guardarTicket, ticketDoc } from '@/lib/api/tickets.js'
import { MOTIVOS_CANCELACION } from '@/utils/ticket.js'

// PATCH /api/tickets/:id/cancelar { motivo } (ADMIN) → ticket actualizado (CANCELADO)
export const PATCH = manejar(async (request, { params }) => {
  const admin = await exigirSesion(request, ['ADMIN'])
  const { id } = await params
  const cuerpo = await leerJson(request)
  const ticket = await ticketDoc(id)
  if (!esActivo(ticket)) throw new ErrorApi(409, 'Este ticket ya no está activo; no se puede cancelar.')

  const motivo = String(cuerpo.motivo ?? '').trim()
  if (!MOTIVOS_CANCELACION.includes(motivo)) throw new ErrorApi(400, 'Elige el motivo de la cancelación.')

  const fecha = new Date()
  ticket.estado = 'CANCELADO'
  ticket.motivoCancelacion = motivo
  ticket.cerradoEn = fecha
  ticket.historial.push({ estado: 'CANCELADO', usuario: persona(admin), comentario: motivo, fecha })
  return json(await guardarTicket(ticket))
})
