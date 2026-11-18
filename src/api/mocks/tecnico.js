import { errorFoto, hayArchivo } from '../../utils/foto.js'
import { campo, urlFoto } from './reportes.js'
import { ticketsMock } from './tickets.js'

// Endpoints del técnico. Los cambios se guardan en memoria hasta recargar la página.

const DIA_MS = 24 * 60 * 60 * 1000
const DIAS_CERRADOS_RECIENTES = 7
const MIN_COMENTARIO = 10
const MAX_COMENTARIO = 1000

const respuesta = (status, datos) => ({ status, datos })
const error = (status, mensaje) => respuesta(status, { mensaje })
const persona = ({ id, nombre }) => ({ id, nombre })
const tiempo = (fecha) => new Date(fecha).getTime()

const VISTAS = {
  asignados: (t) => t.estado === 'ASIGNADO',
  proceso: (t) => t.estado === 'EN_PROCESO',
  cerrados: (t, ahora) => t.estado === 'CERRADO' && ahora - tiempo(t.cerradoEn) <= DIAS_CERRADOS_RECIENTES * DIA_MS,
}

// GET /api/tecnico/tickets?vista=asignados|proceso|cerrados
export function listarTicketsTecnico(consulta, usuario) {
  const ahora = Date.now()
  const vista = VISTAS[consulta.vista] ? consulta.vista : 'asignados'
  const mios = ticketsMock.filter((t) => t.tecnico?.id === usuario.id)

  const conteos = {}
  for (const [clave, cumple] of Object.entries(VISTAS)) conteos[clave] = mios.filter((t) => cumple(t, ahora)).length

  const datos = mios
    .filter((t) => VISTAS[vista](t, ahora))
    .sort((a, b) => (vista === 'cerrados' ? tiempo(b.cerradoEn) - tiempo(a.cerradoEn) : tiempo(a.venceEn) - tiempo(b.venceEn)))
  return respuesta(200, { datos, conteos })
}

// Busca el ticket y revisa que sea del técnico
function ticketDelTecnico(id, usuario) {
  const ticket = ticketsMock.find((t) => t.id === id)
  if (!ticket) return { fallo: error(404, 'Este ticket no existe.') }
  if (ticket.tecnico?.id !== usuario.id) return { fallo: error(403, 'Este ticket no está asignado a ti.') }
  return { ticket }
}

// PATCH /api/tickets/:id/en-proceso
export function marcarEnProceso(id, usuario) {
  const { ticket, fallo } = ticketDelTecnico(id, usuario)
  if (fallo) return fallo
  if (ticket.estado !== 'ASIGNADO') return error(409, 'Solo un ticket Asignado se puede marcar en proceso.')

  ticket.estado = 'EN_PROCESO'
  ticket.historial.push({ estado: 'EN_PROCESO', usuario: persona(usuario), comentario: null, fecha: new Date().toISOString() })
  return respuesta(200, ticket)
}

// PATCH /api/tickets/:id/cerrar (multipart/form-data): foto (obligatoria), comentario
export function cerrarTicket(id, cuerpo, usuario) {
  const { ticket, fallo } = ticketDelTecnico(id, usuario)
  if (fallo) return fallo
  if (ticket.estado !== 'EN_PROCESO') return error(409, 'Solo un ticket En proceso se puede cerrar.')

  const foto = campo(cuerpo, 'foto')
  if (!hayArchivo(foto)) return error(400, 'La foto del arreglo es obligatoria para cerrar el ticket.')
  const problemaFoto = errorFoto(foto)
  if (problemaFoto) return error(400, problemaFoto)

  const comentario = String(campo(cuerpo, 'comentario') ?? '').trim()
  if (comentario.length < MIN_COMENTARIO) {
    return error(400, `Escribe qué se hizo (mínimo ${MIN_COMENTARIO} caracteres).`)
  }
  if (comentario.length > MAX_COMENTARIO) return error(400, `El comentario no puede pasar de ${MAX_COMENTARIO} caracteres.`)

  const fecha = new Date().toISOString()
  ticket.estado = 'CERRADO'
  ticket.fotoCierre = urlFoto(foto)
  ticket.comentarioCierre = comentario
  ticket.cerradoEn = fecha
  ticket.historial.push({ estado: 'CERRADO', usuario: persona(usuario), comentario, fecha })
  return respuesta(200, ticket)
}
