import { Categoria } from '@/models/index.js'
import {
  categoriaDoc,
  conConteo,
  REPETIDA,
  ticketsActivosPorCategoria,
  validarCategoria,
} from '@/lib/api/categorias.js'
import { ErrorApi, json, leerJson, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'

// PATCH /api/categorias/:id { nombre?, horasObjetivo?, activa? } (ADMIN) → Categoria.
// Solo afecta a los tickets nuevos: cada ticket guarda una copia de su categoría.
export const PATCH = manejar(async (request, { params }) => {
  await exigirSesion(request, ['ADMIN'])
  const { id } = await params
  const categoria = await categoriaDoc(id)
  const limpio = validarCategoria(await leerJson(request), { parcial: true })

  if (
    limpio.nombreNormalizado &&
    (await Categoria.exists({ nombreNormalizado: limpio.nombreNormalizado, _id: { $ne: categoria._id } }))
  ) {
    throw REPETIDA()
  }
  // Sin categorías activas nadie podría reportar
  if (limpio.activa === false && categoria.activa && (await Categoria.countDocuments({ activa: true })) === 1) {
    throw new ErrorApi(409, 'Debe quedar al menos una categoría activa para poder reportar.')
  }

  categoria.set(limpio)
  try {
    await categoria.save()
  } catch (error) {
    if (error?.code === 11000) throw REPETIDA()
    throw error
  }
  return json(conConteo(categoria, await ticketsActivosPorCategoria()))
})
