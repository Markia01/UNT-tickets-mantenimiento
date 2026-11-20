import { Ticket, Usuario } from '@/models/index.js'
import { CONFIGURACION, DIA_MS } from '@/lib/api/config.js'
import { inicioDeSemana } from '@/lib/api/fechas.js'
import { aEquipoBasico } from '@/lib/api/formatos.js'
import { json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'
import { cargarTickets, FILTRO_ACTIVOS, tiempo } from '@/lib/api/tickets.js'
import { calcularSemaforo, ORDEN_URGENCIA } from '@/utils/semaforo.js'
import { formatearUbicacion } from '@/utils/ticket.js'

const MAX_ATENCION = 5
const MAX_ACTIVIDAD = 5
const MAX_EQUIPOS = 3

function textoActividad(ticket, entrada) {
  const quien = entrada.usuario?.nombre ?? 'alguien'
  switch (entrada.estado) {
    case 'ABIERTO':
      return `creado por ${quien} · ${ticket.equipo.tipo}, ${ticket.equipo.ubicacion.aula}`
    case 'ASIGNADO':
      return `asignado a ${entrada.tecnico?.nombre ?? 'un técnico'}`
    case 'EN_PROCESO':
      return `en proceso por ${quien}`
    case 'CERRADO':
      return `cerrado por ${quien} con foto de evidencia`
    case 'CANCELADO':
      return `cancelado por ${quien}`
    default:
      return 'actualizado'
  }
}

// GET /api/admin/resumen (ADMIN): números y listas de la pantalla de Inicio (ver docs/api.md)
export const GET = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  const ahora = new Date()
  const desde90 = new Date(ahora.getTime() - CONFIGURACION.reemplazo.dias * DIA_MS)

  const [activos, cerradosSemana, recientes, tecnicos, masFallas] = await Promise.all([
    cargarTickets(FILTRO_ACTIVOS),
    Ticket.countDocuments({ estado: 'CERRADO', cerradoEn: { $gte: inicioDeSemana(ahora) } }),
    // Los 5 cambios más recientes están entre los 5 tickets con el cambio más reciente
    Ticket.aggregate([
      { $addFields: { ultimoCambio: { $max: '$historial.fecha' } } },
      { $sort: { ultimoCambio: -1 } },
      { $limit: MAX_ACTIVIDAD },
      { $lookup: { from: 'equipos', localField: 'equipo', foreignField: '_id', as: 'equipo' } },
      { $unwind: '$equipo' },
    ]),
    Usuario.find({ rol: 'TECNICO' }).lean(),
    Ticket.aggregate([
      { $match: { estado: { $ne: 'CANCELADO' }, creadoEn: { $gte: desde90 } } },
      { $group: { _id: '$equipo', fallas: { $sum: 1 } } },
      { $lookup: { from: 'equipos', localField: '_id', foreignField: '_id', as: 'equipo' } },
      { $unwind: '$equipo' },
    ]),
  ])

  const conSemaforo = activos.map((t) => ({ ticket: t, semaforo: calcularSemaforo(t, ahora) }))

  // Vencidos, por vencer o sin técnico; los más urgentes primero
  const requierenAtencion = conSemaforo
    .filter(({ ticket, semaforo }) => semaforo !== 'A_TIEMPO' || !ticket.tecnico)
    .sort(
      (a, b) =>
        ORDEN_URGENCIA[a.semaforo] - ORDEN_URGENCIA[b.semaforo] || tiempo(a.ticket.venceEn) - tiempo(b.ticket.venceEn),
    )
    .slice(0, MAX_ATENCION)
    .map(({ ticket }) => ticket)

  const actividadReciente = recientes
    .flatMap((ticket) =>
      ticket.historial.map((entrada) => ({
        fecha: new Date(entrada.fecha).toISOString(),
        ticketId: String(ticket._id),
        texto: textoActividad(ticket, entrada),
      })),
    )
    .sort((a, b) => tiempo(b.fecha) - tiempo(a.fecha))
    .slice(0, MAX_ACTIVIDAD)

  const cargaTecnicos = tecnicos
    .map(({ _id, nombre }) => ({
      tecnico: { id: String(_id), nombre },
      activos: activos.filter((t) => t.tecnico?.id === String(_id)).length,
    }))
    .sort((a, b) => a.tecnico.nombre.localeCompare(b.tecnico.nombre, 'es'))

  const equiposMasFallas = masFallas
    .map(({ equipo, fallas }) => ({ equipo: aEquipoBasico(equipo), fallas }))
    .sort(
      (a, b) =>
        b.fallas - a.fallas ||
        formatearUbicacion(a.equipo.ubicacion).localeCompare(formatearUbicacion(b.equipo.ubicacion), 'es'),
    )
    .slice(0, MAX_EQUIPOS)

  return json({
    activos: activos.length,
    cerradosSemana,
    vencidos: conSemaforo.filter(({ semaforo }) => semaforo === 'VENCIDO').length,
    sinAsignar: activos.filter((t) => !t.tecnico).length,
    requierenAtencion,
    actividadReciente,
    cargaTecnicos,
    equiposMasFallas,
  })
})
