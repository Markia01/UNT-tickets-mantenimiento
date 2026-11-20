import { Equipo } from '@/models/index.js'
import { revisarRepetido, validarEquipo } from '@/lib/api/equipos.js'
import { consultaDe, json, leerJson, manejar, normalizar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'
import { conFallas, fallasPorEquipo, tiempo } from '@/lib/api/tickets.js'

// GET /api/equipos?q=&edificio=&tipo=&estado= (ADMIN) → [Equipo con fallas], de más a menos fallas
export const GET = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  const consulta = consultaDe(request)
  const estado = consulta.estado || 'ACTIVO'
  const q = normalizar(consulta.q)

  const filtro = {}
  if (estado !== 'TODOS') filtro.estado = estado
  if (consulta.edificio) filtro['ubicacion.edificio'] = consulta.edificio
  if (consulta.tipo) filtro.tipo = consulta.tipo

  const [equipos, fallas] = await Promise.all([Equipo.find(filtro).lean(), fallasPorEquipo()])
  return json(
    equipos
      .filter((e) => !q || normalizar(e.tipo).includes(q) || normalizar(e.descripcion).includes(q))
      .map((e) => conFallas(e, fallas))
      .sort(
        (a, b) =>
          b.fallas - a.fallas ||
          (b.ultimaFalla ? tiempo(b.ultimaFalla) : 0) - (a.ultimaFalla ? tiempo(a.ultimaFalla) : 0) ||
          a.tipo.localeCompare(b.tipo, 'es'),
      ),
  )
})

// POST /api/equipos { tipo, descripcion, ubicacion } (ADMIN) → 201 Equipo (ACTIVO)
export const POST = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  const limpio = await validarEquipo(await leerJson(request))
  await revisarRepetido(limpio)
  const equipo = await Equipo.create({ ...limpio, estado: 'ACTIVO' })
  return json(conFallas(equipo, new Map()), 201)
})
