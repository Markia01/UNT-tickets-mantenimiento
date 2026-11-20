import { esActivo } from '@/utils/semaforo.js'
import { Equipo, Ticket } from '@/models/index.js'
import { CONFIGURACION, DIA_MS } from './config.js'
import { aEquipoBasico, aTicket } from './formatos.js'
import { ErrorApi, esObjectId } from './respuestas.js'

export { esActivo }

export const ESTADOS_ACTIVOS = ['ABIERTO', 'ASIGNADO', 'EN_PROCESO']
export const FILTRO_ACTIVOS = { estado: { $in: ESTADOS_ACTIVOS } }

export const tiempo = (fecha) => new Date(fecha).getTime()

// Tickets (forma del contrato) que cumplen `filtro`
export async function cargarTickets(filtro = {}, orden = null) {
  let consulta = Ticket.find(filtro).populate('equipo').lean()
  if (orden) consulta = consulta.sort(orden)
  return (await consulta).map(aTicket)
}

// Documento de Mongoose del ticket (con el equipo cargado) o 404
export async function ticketDoc(id) {
  const folio = /^\d+$/.test(String(id)) ? Number(id) : null
  const ticket = folio === null ? null : await Ticket.findById(folio).populate('equipo')
  if (!ticket) throw new ErrorApi(404, 'Este ticket no existe.')
  return ticket
}

// Equipo (documento) o 404
export async function equipoDoc(id) {
  const equipo = esObjectId(id) ? await Equipo.findById(id) : null
  if (!equipo) throw new ErrorApi(404, 'Este equipo no existe.')
  return equipo
}

// 'PROPIO' si lo reportó el usuario, 'SUMADO' si se sumó, null si no tiene relación
export function relacion(ticket, usuarioId) {
  if (ticket.reporta.id === usuarioId) return 'PROPIO'
  if (ticket.sumados?.some((p) => p.id === usuarioId)) return 'SUMADO'
  return null
}

// Guarda los cambios del ticket y lo devuelve con la forma del contrato
export async function guardarTicket(doc) {
  await doc.save()
  await doc.populate('equipo')
  return aTicket(doc.toObject())
}

// Reporte activo más reciente de un equipo (forma del contrato) o null
export async function activoDeEquipo(equipoId) {
  const [ticket] = await cargarTickets({ equipo: equipoId, ...FILTRO_ACTIVOS }, { creadoEn: -1 })
  return ticket ?? null
}

// Por equipo: fallas en la ventana de la regla de reemplazo, total y última falla.
// Falla = ticket del equipo que no está cancelado.
export async function fallasPorEquipo(ahora = new Date(), equipoIds = null) {
  const desde = new Date(ahora.getTime() - CONFIGURACION.reemplazo.dias * DIA_MS)
  const filtro = { estado: { $ne: 'CANCELADO' } }
  if (equipoIds) filtro.equipo = { $in: equipoIds }
  const grupos = await Ticket.aggregate([
    { $match: filtro },
    {
      $group: {
        _id: '$equipo',
        total: { $sum: 1 },
        enVentana: { $sum: { $cond: [{ $gte: ['$creadoEn', desde] }, 1, 0] } },
        ultima: { $max: '$creadoEn' },
      },
    },
  ])
  return new Map(grupos.map((g) => [String(g._id), g]))
}

// Equipo con `fallas` (ventana de 90 días) y `ultimaFalla`
export function conFallas(equipo, fallas) {
  const datos = fallas.get(String(equipo._id))
  return {
    ...aEquipoBasico(equipo),
    fallas: datos?.enVentana ?? 0,
    ultimaFalla: datos?.ultima ? new Date(datos.ultima).toISOString() : null,
  }
}
