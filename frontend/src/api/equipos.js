import { aQuery, llamarApi } from './cliente.js'

// GET /equipos?q=&edificio=&tipo=&estado= (ADMIN) → [equipo], de más a menos fallas.
// estado: ACTIVO (por defecto) | BAJA | TODOS
export function getEquipos(filtros) {
  return llamarApi(`/equipos${aQuery(filtros)}`)
}

// GET /equipos/:id (ADMIN) → { equipo, estadisticas, tickets }. 404 si no existe.
export function getEquipo(id) {
  return llamarApi(`/equipos/${encodeURIComponent(id)}`)
}

// POST /equipos (ADMIN) { tipo, descripcion, ubicacion: { edificio, aula } } → equipo creado
export function crearEquipo(datos) {
  return llamarApi('/equipos', { metodo: 'POST', cuerpo: datos })
}

// PATCH /equipos/:id (ADMIN) { tipo, descripcion, ubicacion, estado } → equipo actualizado
export function editarEquipo(id, datos) {
  return llamarApi(`/equipos/${encodeURIComponent(id)}`, { metodo: 'PATCH', cuerpo: datos })
}

// GET /configuracion (ADMIN) → { reemplazo: { fallas, dias } }
export function getConfiguracion() {
  return llamarApi('/configuracion')
}
