import { esActivo } from '../../utils/semaforo.js'
import { categoriasMock } from './catalogos.js'
import { ticketsMock } from './tickets.js'

// GET/POST/PATCH /api/categorias (ADMIN). Los cambios se guardan en `categoriasMock` (en memoria).
// Los tickets guardan una copia de su categoría (copiaCategoria), así que editar una
// categoría solo afecta a los tickets nuevos. No hay borrado: se desactivan.

const MAX_NOMBRE = 40

const respuesta = (status, datos) => ({ status, datos })
const error = (status, mensaje) => respuesta(status, { mensaje })
const NO_EXISTE = error(404, 'Esta categoría no existe.')

// "Cómputo" ≈ "computo"
const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

// Categoría con el número de tickets activos que la usan
const conConteo = (c) => ({
  ...c,
  ticketsActivos: ticketsMock.filter((t) => esActivo(t) && t.categoria.id === c.id).length,
})

// Valida y limpia los campos. Con `parcial`, los ausentes no se exigen.
function validar(cuerpo = {}, { parcial = false } = {}) {
  const limpio = {}
  if (!parcial || cuerpo.nombre !== undefined) {
    const nombre = String(cuerpo.nombre ?? '').trim().replace(/\s+/g, ' ')
    if (!nombre) return { mensaje: 'Escribe el nombre de la categoría.' }
    if (nombre.length > MAX_NOMBRE) return { mensaje: `El nombre no puede pasar de ${MAX_NOMBRE} caracteres.` }
    limpio.nombre = nombre
  }
  if (!parcial || cuerpo.horasObjetivo !== undefined) {
    if (!Number.isInteger(cuerpo.horasObjetivo) || cuerpo.horasObjetivo <= 0) {
      return { mensaje: 'Las horas objetivo deben ser un número entero mayor que 0.' }
    }
    limpio.horasObjetivo = cuerpo.horasObjetivo
  }
  if (parcial && cuerpo.activa !== undefined) {
    if (typeof cuerpo.activa !== 'boolean') return { mensaje: 'Estado no válido.' }
    limpio.activa = cuerpo.activa
  }
  return { limpio }
}

const nombreRepetido = (nombre, exceptoId) =>
  categoriasMock.some((c) => c.id !== exceptoId && normalizar(c.nombre) === normalizar(nombre))
const REPETIDO = error(409, 'Ya existe una categoría con ese nombre.')

// GET /api/categorias → [Categoria + ticketsActivos], por nombre (activas e inactivas)
export function listarCategorias() {
  const categorias = categoriasMock.map(conConteo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return respuesta(200, categorias)
}

// POST /api/categorias { nombre, horasObjetivo } → 201 Categoria
export function crearCategoria(cuerpo) {
  const { limpio, mensaje } = validar(cuerpo)
  if (mensaje) return error(400, mensaje)
  if (nombreRepetido(limpio.nombre)) return REPETIDO

  const siguiente = Math.max(0, ...categoriasMock.map((c) => Number(c.id.slice(1)) || 0)) + 1
  const categoria = { id: `c${siguiente}`, ...limpio, activa: true }
  categoriasMock.push(categoria)
  return respuesta(201, conConteo(categoria))
}

// PATCH /api/categorias/:id { nombre?, horasObjetivo?, activa? } → 200 Categoria
export function editarCategoria(id, cuerpo) {
  const categoria = categoriasMock.find((c) => c.id === id)
  if (!categoria) return NO_EXISTE

  const { limpio, mensaje } = validar(cuerpo, { parcial: true })
  if (mensaje) return error(400, mensaje)
  if (limpio.nombre !== undefined && nombreRepetido(limpio.nombre, id)) return REPETIDO
  // Sin categorías activas nadie podría reportar
  if (limpio.activa === false && categoria.activa && categoriasMock.filter((c) => c.activa).length === 1) {
    return error(409, 'Debe quedar al menos una categoría activa para poder reportar.')
  }

  Object.assign(categoria, limpio)
  return respuesta(200, conConteo(categoria))
}
