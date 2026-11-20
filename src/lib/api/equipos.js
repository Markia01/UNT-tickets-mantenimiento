import { Equipo } from '@/models/index.js'
import { EDIFICIOS, TIPOS_EQUIPO } from './config.js'
import { ErrorApi, normalizar } from './respuestas.js'

const ESTADOS = ['ACTIVO', 'BAJA']

// Valida y limpia los campos de POST/PATCH /api/equipos. Con `parcial`, los ausentes no se exigen.
export async function validarEquipo(cuerpo = {}, { parcial = false } = {}) {
  const limpio = {}
  const viene = (valor) => !parcial || valor !== undefined

  if (viene(cuerpo.tipo)) {
    if (!TIPOS_EQUIPO.includes(cuerpo.tipo)) throw new ErrorApi(400, 'Elige un tipo de equipo válido.')
    limpio.tipo = cuerpo.tipo
  }
  if (viene(cuerpo.descripcion)) {
    const descripcion = String(cuerpo.descripcion ?? '').trim()
    if (!descripcion) throw new ErrorApi(400, 'Escribe la descripción del equipo.')
    limpio.descripcion = descripcion
  }
  if (viene(cuerpo.ubicacion)) {
    const edificio = cuerpo.ubicacion?.edificio
    const aula = String(cuerpo.ubicacion?.aula ?? '').trim()
    const edificios = new Set([...EDIFICIOS, ...(await Equipo.distinct('ubicacion.edificio'))])
    if (!edificios.has(edificio)) throw new ErrorApi(400, 'Elige un edificio válido.')
    if (!aula) throw new ErrorApi(400, 'Escribe el aula o espacio.')
    limpio.ubicacion = { edificio, aula }
  }
  if (parcial && cuerpo.estado !== undefined) {
    if (!ESTADOS.includes(cuerpo.estado)) throw new ErrorApi(400, 'Estado no válido.')
    limpio.estado = cuerpo.estado
  }
  return limpio
}

// 409 si ya hay otro equipo con el mismo tipo, descripción y ubicación (sin mayúsculas ni acentos)
export async function revisarRepetido(equipo, exceptoId = null) {
  const mismos = await Equipo.find({ tipo: equipo.tipo, 'ubicacion.edificio': equipo.ubicacion.edificio }).lean()
  const repetido = mismos.some(
    (e) =>
      String(e._id) !== String(exceptoId) &&
      normalizar(e.descripcion) === normalizar(equipo.descripcion) &&
      normalizar(e.ubicacion.aula) === normalizar(equipo.ubicacion.aula),
  )
  if (repetido) throw new ErrorApi(409, 'Ya existe un equipo igual en esa ubicación.')
}
