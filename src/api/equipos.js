import { aQuery, llamarApi } from './cliente.js'

// GET /api/equipos?q=&edificio=&tipo=&estado= (ADMIN) → [equipo], de más a menos fallas.
// estado: ACTIVO (por defecto) | BAJA | TODOS
export function getEquipos(filtros) {
  return llamarApi(`/api/equipos${aQuery(filtros)}`)
}

// GET /api/equipos/:id (ADMIN) → { equipo, estadisticas, tickets }. 404 si no existe.
export function getEquipo(id) {
  return llamarApi(`/api/equipos/${encodeURIComponent(id)}`)
}

// POST /api/equipos (ADMIN) { tipo, descripcion, ubicacion: { edificio, aula } } → equipo creado
export function crearEquipo(datos) {
  return llamarApi('/api/equipos', { metodo: 'POST', cuerpo: datos })
}

// PATCH /api/equipos/:id (ADMIN) { tipo, descripcion, ubicacion, estado } → equipo actualizado
export function editarEquipo(id, datos) {
  return llamarApi(`/api/equipos/${encodeURIComponent(id)}`, { metodo: 'PATCH', cuerpo: datos })
}

// GET /api/configuracion (ADMIN) → { reemplazo: { fallas, dias } }
export function getConfiguracion() {
  return llamarApi('/api/configuracion')
}
