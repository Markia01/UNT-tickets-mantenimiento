import { guardarFoto, validarFoto } from '@/lib/api/fotos.js'
import { ErrorApi, json, leerFormulario, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion, persona } from '@/lib/api/sesion.js'
import { guardarTicket, ticketDoc } from '@/lib/api/tickets.js'

const MIN_COMENTARIO = 10
const MAX_COMENTARIO = 1000

// PATCH /api/tickets/:id/cerrar (TECNICO asignado, multipart/form-data): foto (obligatoria), comentario
export const PATCH = manejar(async (request, { params }) => {
  const tecnico = await exigirSesion(request, ['TECNICO'])
  const { id } = await params
  const ticket = await ticketDoc(id)
  if (ticket.tecnico?.id !== String(tecnico._id)) throw new ErrorApi(403, 'Este ticket no está asignado a ti.')
  if (ticket.estado !== 'EN_PROCESO') throw new ErrorApi(409, 'Solo un ticket En proceso se puede cerrar.')

  const formulario = await leerFormulario(request)
  const foto = validarFoto(formulario.get('foto'), {
    obligatoria: true,
    mensajeFalta: 'La foto del arreglo es obligatoria para cerrar el ticket.',
  })
  const comentario = String(formulario.get('comentario') ?? '').trim()
  if (comentario.length < MIN_COMENTARIO) {
    throw new ErrorApi(400, `Escribe qué se hizo (mínimo ${MIN_COMENTARIO} caracteres).`)
  }
  if (comentario.length > MAX_COMENTARIO) {
    throw new ErrorApi(400, `El comentario no puede pasar de ${MAX_COMENTARIO} caracteres.`)
  }

  const fecha = new Date()
  ticket.estado = 'CERRADO'
  ticket.fotoCierre = await guardarFoto(foto)
  ticket.comentarioCierre = comentario
  ticket.cerradoEn = fecha
  ticket.historial.push({ estado: 'CERRADO', usuario: persona(tecnico), comentario, fecha })
  return json(await guardarTicket(ticket))
})
