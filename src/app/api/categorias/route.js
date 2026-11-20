import { Categoria } from '@/models/index.js'
import { conConteo, REPETIDA, ticketsActivosPorCategoria, validarCategoria } from '@/lib/api/categorias.js'
import { json, leerJson, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'

// GET /api/categorias (ADMIN) → [Categoria + ticketsActivos], por nombre (activas e inactivas)
export const GET = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  const [categorias, conteos] = await Promise.all([Categoria.find().lean(), ticketsActivosPorCategoria()])
  return json(categorias.map((c) => conConteo(c, conteos)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
})

// POST /api/categorias { nombre, horasObjetivo } (ADMIN) → 201 Categoria
export const POST = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  const limpio = validarCategoria(await leerJson(request))
  if (await Categoria.exists({ nombreNormalizado: limpio.nombreNormalizado })) throw REPETIDA()
  try {
    const categoria = await Categoria.create({ ...limpio, activa: true })
    return json(conConteo(categoria, new Map()), 201)
  } catch (error) {
    if (error?.code === 11000) throw REPETIDA()
    throw error
  }
})
