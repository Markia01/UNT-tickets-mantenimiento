import { esActivo } from '../../utils/semaforo.js'
import { MOTIVOS_CANCELACION } from '../../utils/ticket.js'
import { ticketsMock } from './tickets.js'
import { usuariosMock } from './usuarios.js'

// Estas funciones modifican los tickets de prueba en memoria, así que los cambios
// se ven al navegar (Inicio, lista, detalle) hasta que se recarga la página.

const respuesta = (status, datos) => ({ status, datos })
const error = (status, mensaje) => respuesta(status, { mensaje })
const NO_EXISTE = error(404, 'Este ticket no existe.')

const persona = ({ id, nombre }) => ({ id, nombre })
const buscar = (id) => ticketsMock.find((t) => t.id === id)

// GET /tickets/:id
export function obtenerTicket(id) {
  const ticket = buscar(id)
  return ticket ? respuesta(200, ticket) : NO_EXISTE
}

// GET /tecnicos → técnicos activos con su número de tickets activos
export function listarTecnicos() {
  const tecnicos = usuariosMock
    .filter((u) => u.rol === 'TECNICO' && u.activo !== false)
    .map(({ id, nombre }) => ({
      id,
      nombre,
      activos: ticketsMock.filter((t) => esActivo(t) && t.tecnico?.id === id).length,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return respuesta(200, tecnicos)
}

// PATCH /tickets/:id/asignar { tecnicoId }
export function asignarTecnico(id, cuerpo, usuario) {
  const ticket = buscar(id)
  if (!ticket) return NO_EXISTE
  if (!esActivo(ticket)) return error(409, 'Este ticket ya no está activo; no se puede asignar.')

  const tecnico = usuariosMock.find(
    (u) => u.id === cuerpo?.tecnicoId && u.rol === 'TECNICO' && u.activo !== false,
  )
  if (!tecnico) return error(400, 'Elige un técnico válido.')
  if (ticket.tecnico?.id === tecnico.id) return error(400, 'El ticket ya está asignado a ese técnico.')

  const anterior = ticket.tecnico
  ticket.tecnico = persona(tecnico)
  ticket.estado = 'ASIGNADO'
  ticket.historial.push({
    estado: 'ASIGNADO',
    usuario: persona(usuario),
    tecnico: persona(tecnico),
    comentario: anterior ? `Reasignado; antes lo tenía ${anterior.nombre}.` : null,
    fecha: new Date().toISOString(),
  })
  return respuesta(200, ticket)
}

// PATCH /tickets/:id/cancelar { motivo }
export function cancelarTicket(id, cuerpo, usuario) {
  const ticket = buscar(id)
  if (!ticket) return NO_EXISTE
  if (!esActivo(ticket)) return error(409, 'Este ticket ya no está activo; no se puede cancelar.')

  const motivo = String(cuerpo?.motivo ?? '').trim()
  if (!MOTIVOS_CANCELACION.includes(motivo)) return error(400, 'Elige el motivo de la cancelación.')

  const fecha = new Date().toISOString()
  ticket.estado = 'CANCELADO'
  ticket.motivoCancelacion = motivo
  ticket.cerradoEn = fecha
  ticket.historial.push({ estado: 'CANCELADO', usuario: persona(usuario), comentario: motivo, fecha })
  return respuesta(200, ticket)
}
