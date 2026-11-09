import { inicioDeSemana } from '../../utils/fechas.js'
import { calcularSemaforo, esActivo, ORDEN_URGENCIA } from '../../utils/semaforo.js'
import { formatearUbicacion } from '../../utils/ticket.js'
import { ticketsMock } from './tickets.js'
import { usuariosMock } from './usuarios.js'

const DIA_MS = 24 * 60 * 60 * 1000
const MAX_ATENCION = 5
const MAX_ACTIVIDAD = 5
const MAX_EQUIPOS = 3
const DIAS_FALLAS = 90

const tiempo = (fecha) => new Date(fecha).getTime()

function textoActividad(ticket, entrada) {
  const quien = entrada.usuario?.nombre ?? 'alguien'
  switch (entrada.estado) {
    case 'ABIERTO':
      return `creado por ${quien} · ${ticket.equipo.tipo}, ${ticket.equipo.ubicacion.aula}`
    case 'ASIGNADO':
      return `asignado a ${entrada.tecnico?.nombre ?? ticket.tecnico?.nombre ?? 'un técnico'}`
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

// Calcula GET /admin/resumen a partir de los tickets de prueba (ver docs/api.md)
export function calcularResumen(tickets = ticketsMock, ahora = new Date()) {
  const activos = tickets.filter(esActivo)
  const conSemaforo = activos.map((t) => ({ ticket: t, semaforo: calcularSemaforo(t, ahora) }))

  const semana = inicioDeSemana(ahora).getTime()
  const cerradosSemana = tickets.filter(
    (t) => t.estado === 'CERRADO' && t.cerradoEn && tiempo(t.cerradoEn) >= semana,
  ).length

  // Vencidos, por vencer o sin técnico; los más urgentes primero
  const requierenAtencion = conSemaforo
    .filter(({ ticket, semaforo }) => semaforo !== 'A_TIEMPO' || !ticket.tecnico)
    .sort(
      (a, b) =>
        ORDEN_URGENCIA[a.semaforo] - ORDEN_URGENCIA[b.semaforo] ||
        tiempo(a.ticket.venceEn) - tiempo(b.ticket.venceEn),
    )
    .slice(0, MAX_ATENCION)
    .map(({ ticket }) => ticket)

  const actividadReciente = tickets
    .flatMap((ticket) =>
      ticket.historial.map((entrada) => ({
        fecha: entrada.fecha,
        ticketId: ticket.id,
        texto: textoActividad(ticket, entrada),
      })),
    )
    .sort((a, b) => tiempo(b.fecha) - tiempo(a.fecha))
    .slice(0, MAX_ACTIVIDAD)

  const cargaTecnicos = usuariosMock
    .filter((u) => u.rol === 'TECNICO')
    .map(({ id, nombre }) => ({
      tecnico: { id, nombre },
      activos: activos.filter((t) => t.tecnico?.id === id).length,
    }))
    .sort((a, b) => a.tecnico.nombre.localeCompare(b.tecnico.nombre, 'es'))

  // Fallas = tickets no cancelados reportados en los últimos 90 días
  const desde = tiempo(ahora) - DIAS_FALLAS * DIA_MS
  const fallasPorEquipo = new Map()
  for (const t of tickets) {
    if (t.estado === 'CANCELADO' || tiempo(t.creadoEn) < desde) continue
    const previo = fallasPorEquipo.get(t.equipo.id)
    fallasPorEquipo.set(t.equipo.id, { equipo: t.equipo, fallas: (previo?.fallas ?? 0) + 1 })
  }
  const equiposMasFallas = [...fallasPorEquipo.values()]
    .sort(
      (a, b) =>
        b.fallas - a.fallas ||
        formatearUbicacion(a.equipo.ubicacion).localeCompare(formatearUbicacion(b.equipo.ubicacion), 'es'),
    )
    .slice(0, MAX_EQUIPOS)

  return {
    activos: activos.length,
    cerradosSemana,
    vencidos: conSemaforo.filter(({ semaforo }) => semaforo === 'VENCIDO').length,
    sinAsignar: activos.filter((t) => !t.tecnico).length,
    requierenAtencion,
    actividadReciente,
    cargaTecnicos,
    equiposMasFallas,
  }
}
