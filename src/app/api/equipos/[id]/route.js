import { HORA_MS } from '@/lib/api/config.js'
import { revisarRepetido, validarEquipo } from '@/lib/api/equipos.js'
import { json, leerJson, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'
import { cargarTickets, conFallas, equipoDoc, fallasPorEquipo, tiempo } from '@/lib/api/tickets.js'

// GET /api/equipos/:id (ADMIN) → { equipo, estadisticas, tickets }
export const GET = manejar(async (request, { params }) => {
  await exigirSesion(request, ['ADMIN'])
  const { id } = await params
  const equipo = await equipoDoc(id)

  const [tickets, fallas] = await Promise.all([
    cargarTickets({ equipo: equipo._id }, { creadoEn: -1 }),
    fallasPorEquipo(new Date(), [equipo._id]),
  ])
  const cerrados = tickets.filter((t) => t.estado === 'CERRADO' && t.cerradoEn)
  const promedio = cerrados.length
    ? cerrados.reduce((suma, t) => suma + (tiempo(t.cerradoEn) - tiempo(t.creadoEn)), 0) / cerrados.length / HORA_MS
    : null
  const conDatos = conFallas(equipo, fallas)

  return json({
    equipo: conDatos,
    estadisticas: {
      fallasTotales: tickets.filter((t) => t.estado !== 'CANCELADO').length,
      tiempoPromedioHoras: promedio === null ? null : Math.round(promedio * 10) / 10,
      ultimaFalla: conDatos.ultimaFalla,
      fallasUltimos90: conDatos.fallas,
    },
    tickets,
  })
})

// PATCH /api/equipos/:id { tipo?, descripcion?, ubicacion?, estado? } (ADMIN) → Equipo
export const PATCH = manejar(async (request, { params }) => {
  await exigirSesion(request, ['ADMIN'])
  const { id } = await params
  const equipo = await equipoDoc(id)
  const limpio = await validarEquipo(await leerJson(request), { parcial: true })

  const resultado = { tipo: equipo.tipo, descripcion: equipo.descripcion, ubicacion: equipo.ubicacion, ...limpio }
  await revisarRepetido(resultado, equipo._id)

  equipo.set(limpio)
  await equipo.save()
  return json(conFallas(equipo, await fallasPorEquipo(new Date(), [equipo._id])))
})
