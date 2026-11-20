import { Categoria, Ticket } from '@/models/index.js'
import { aCategoria } from './formatos.js'
import { ErrorApi, esObjectId, limpiarEspacios, normalizar } from './respuestas.js'
import { FILTRO_ACTIVOS } from './tickets.js'

const MAX_NOMBRE = 40

// Valida y limpia los campos. Con `parcial`, los ausentes no se exigen.
export function validarCategoria(cuerpo = {}, { parcial = false } = {}) {
  const limpio = {}
  if (!parcial || cuerpo.nombre !== undefined) {
    const nombre = limpiarEspacios(cuerpo.nombre)
    if (!nombre) throw new ErrorApi(400, 'Escribe el nombre de la categoría.')
    if (nombre.length > MAX_NOMBRE) throw new ErrorApi(400, `El nombre no puede pasar de ${MAX_NOMBRE} caracteres.`)
    limpio.nombre = nombre
    limpio.nombreNormalizado = normalizar(nombre)
  }
  if (!parcial || cuerpo.horasObjetivo !== undefined) {
    if (!Number.isInteger(cuerpo.horasObjetivo) || cuerpo.horasObjetivo <= 0) {
      throw new ErrorApi(400, 'Las horas objetivo deben ser un número entero mayor que 0.')
    }
    limpio.horasObjetivo = cuerpo.horasObjetivo
  }
  if (parcial && cuerpo.activa !== undefined) {
    if (typeof cuerpo.activa !== 'boolean') throw new ErrorApi(400, 'Estado no válido.')
    limpio.activa = cuerpo.activa
  }
  return limpio
}

export const REPETIDA = () => new ErrorApi(409, 'Ya existe una categoría con ese nombre.')

export async function categoriaDoc(id) {
  const categoria = esObjectId(id) ? await Categoria.findById(id) : null
  if (!categoria) throw new ErrorApi(404, 'Esta categoría no existe.')
  return categoria
}

// Tickets activos por categoría: Map(id → número)
export async function ticketsActivosPorCategoria() {
  const grupos = await Ticket.aggregate([
    { $match: FILTRO_ACTIVOS },
    { $group: { _id: '$categoria.id', total: { $sum: 1 } } },
  ])
  return new Map(grupos.map((g) => [g._id, g.total]))
}

export const conConteo = (doc, conteos) => ({ ...aCategoria(doc), ticketsActivos: conteos.get(String(doc._id)) ?? 0 })
