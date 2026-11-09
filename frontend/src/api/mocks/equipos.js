import { configuracionMock, equiposMock, tiposEquipoMock } from './catalogos.js'
import { obtenerCatalogos } from './listaTickets.js'
import { ticketsMock } from './tickets.js'

// GET/POST/PATCH de equipos. Los cambios se guardan en `equiposMock` (en memoria).
// Los tickets apuntan al mismo objeto de equipo, así que un cambio de descripción
// o ubicación también se ve en sus tickets.

const DIA_MS = 24 * 60 * 60 * 1000
const HORA_MS = 60 * 60 * 1000
const ESTADOS = ['ACTIVO', 'BAJA']

const respuesta = (status, datos) => ({ status, datos })
const error = (status, mensaje) => respuesta(status, { mensaje })
const NO_EXISTE = error(404, 'Este equipo no existe.')

const tiempo = (fecha) => new Date(fecha).getTime()

// "Aire acondicionado" ≈ "aire ACONDICIONADO"; "Pizarrón" ≈ "pizarron"
const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

// Fallas = tickets del equipo que no están cancelados (de más reciente a más antiguo)
const fallasDe = (equipoId) =>
  ticketsMock
    .filter((t) => t.equipo.id === equipoId && t.estado !== 'CANCELADO')
    .sort((a, b) => tiempo(b.creadoEn) - tiempo(a.creadoEn))

// Equipo con `fallas` (en la ventana de la regla de reemplazo) y `ultimaFalla`
function conFallas(equipo, ahora = new Date()) {
  const fallas = fallasDe(equipo.id)
  const desde = tiempo(ahora) - configuracionMock.reemplazo.dias * DIA_MS
  return {
    ...equipo,
    fallas: fallas.filter((t) => tiempo(t.creadoEn) >= desde).length,
    ultimaFalla: fallas[0]?.creadoEn ?? null,
  }
}

// GET /equipos?q=&edificio=&tipo=&estado=
export function listarEquipos(consulta = {}) {
  const estado = consulta.estado || 'ACTIVO'
  const q = normalizar(consulta.q)

  const equipos = equiposMock
    .filter((e) => estado === 'TODOS' || e.estado === estado)
    .filter((e) => !consulta.edificio || e.ubicacion.edificio === consulta.edificio)
    .filter((e) => !consulta.tipo || e.tipo === consulta.tipo)
    .filter((e) => !q || normalizar(e.tipo).includes(q) || normalizar(e.descripcion).includes(q))
    .map((e) => conFallas(e))
    .sort(
      (a, b) =>
        b.fallas - a.fallas ||
        (b.ultimaFalla ? tiempo(b.ultimaFalla) : 0) - (a.ultimaFalla ? tiempo(a.ultimaFalla) : 0) ||
        a.tipo.localeCompare(b.tipo, 'es'),
    )

  return respuesta(200, equipos)
}

// GET /equipos/:id → { equipo, estadisticas, tickets }
export function obtenerEquipo(id, ahora = new Date()) {
  const equipo = equiposMock.find((e) => e.id === id)
  if (!equipo) return NO_EXISTE

  const tickets = ticketsMock
    .filter((t) => t.equipo.id === id)
    .sort((a, b) => tiempo(b.creadoEn) - tiempo(a.creadoEn))
  const fallas = fallasDe(id)
  const cerrados = tickets.filter((t) => t.estado === 'CERRADO' && t.cerradoEn)
  const promedio = cerrados.length
    ? cerrados.reduce((suma, t) => suma + (tiempo(t.cerradoEn) - tiempo(t.creadoEn)), 0) / cerrados.length / HORA_MS
    : null
  const conDatos = conFallas(equipo, ahora)

  return respuesta(200, {
    equipo: conDatos,
    estadisticas: {
      fallasTotales: fallas.length,
      tiempoPromedioHoras: promedio === null ? null : Math.round(promedio * 10) / 10,
      ultimaFalla: conDatos.ultimaFalla,
      fallasUltimos90: conDatos.fallas,
    },
    tickets,
  })
}

// Valida y limpia los campos de POST/PATCH. Con `parcial`, los campos ausentes no se exigen.
function validar(cuerpo = {}, { parcial = false } = {}) {
  const { edificios } = obtenerCatalogos()
  const limpio = {}
  const falta = (campo) => !parcial || campo !== undefined

  if (falta(cuerpo.tipo)) {
    if (!tiposEquipoMock.includes(cuerpo.tipo)) return { mensaje: 'Elige un tipo de equipo válido.' }
    limpio.tipo = cuerpo.tipo
  }
  if (falta(cuerpo.descripcion)) {
    const descripcion = String(cuerpo.descripcion ?? '').trim()
    if (!descripcion) return { mensaje: 'Escribe la descripción del equipo.' }
    limpio.descripcion = descripcion
  }
  if (falta(cuerpo.ubicacion)) {
    const edificio = cuerpo.ubicacion?.edificio
    const aula = String(cuerpo.ubicacion?.aula ?? '').trim()
    if (!edificios.includes(edificio)) return { mensaje: 'Elige un edificio válido.' }
    if (!aula) return { mensaje: 'Escribe el aula o espacio.' }
    limpio.ubicacion = { edificio, aula }
  }
  if (parcial && cuerpo.estado !== undefined) {
    if (!ESTADOS.includes(cuerpo.estado)) return { mensaje: 'Estado no válido.' }
    limpio.estado = cuerpo.estado
  }
  return { limpio }
}

const mismaUbicacionYDescripcion = (a, b) =>
  a.tipo === b.tipo &&
  normalizar(a.descripcion) === normalizar(b.descripcion) &&
  a.ubicacion.edificio === b.ubicacion.edificio &&
  normalizar(a.ubicacion.aula) === normalizar(b.ubicacion.aula)

// POST /equipos { tipo, descripcion, ubicacion }
export function crearEquipo(cuerpo) {
  const { limpio, mensaje } = validar(cuerpo)
  if (mensaje) return error(400, mensaje)
  if (equiposMock.some((e) => mismaUbicacionYDescripcion(e, limpio))) {
    return error(409, 'Ya existe un equipo igual en esa ubicación.')
  }

  const siguiente = Math.max(0, ...equiposMock.map((e) => Number(e.id.slice(1)) || 0)) + 1
  const equipo = { id: `e${siguiente}`, ...limpio, estado: 'ACTIVO' }
  equiposMock.push(equipo)
  return respuesta(201, conFallas(equipo))
}

// PATCH /equipos/:id { tipo?, descripcion?, ubicacion?, estado? }
export function editarEquipo(id, cuerpo) {
  const equipo = equiposMock.find((e) => e.id === id)
  if (!equipo) return NO_EXISTE

  const { limpio, mensaje } = validar(cuerpo, { parcial: true })
  if (mensaje) return error(400, mensaje)
  const resultado = { ...equipo, ...limpio }
  if (equiposMock.some((e) => e.id !== id && mismaUbicacionYDescripcion(e, resultado))) {
    return error(409, 'Ya existe un equipo igual en esa ubicación.')
  }

  // Se modifica el mismo objeto para que los tickets que lo usan vean el cambio
  Object.assign(equipo, limpio)
  return respuesta(200, conFallas(equipo))
}

// GET /configuracion
export function obtenerConfiguracion() {
  return respuesta(200, configuracionMock)
}
