import { aQuery, llamarApi } from './cliente.js'

// GET /tickets (ADMIN) → { datos: [ticket], total, pagina, porPagina, conteos }
// Parámetros: vista, q, desde, hasta, edificio, categoria, tiempo, tecnico, pagina, porPagina.
// Detalle en docs/api.md.
export function getTickets(filtros) {
  return llamarApi(`/tickets${aQuery(filtros)}`)
}

// GET /catalogos (cualquier rol) → { edificios: [string], categorias: [{ id, nombre, horasObjetivo }] }
export function getCatalogos() {
  return llamarApi('/catalogos')
}

// GET /tickets/:id (ADMIN) → ticket completo. 404 si no existe.
export function getTicket(id) {
  return llamarApi(`/tickets/${encodeURIComponent(id)}`)
}

// GET /tecnicos (ADMIN) → [{ id, nombre, activos }] solo técnicos activos
export function getTecnicos() {
  return llamarApi('/tecnicos')
}

// PATCH /tickets/:id/asignar (ADMIN) → ticket actualizado (estado ASIGNADO)
export function asignarTecnico(id, tecnicoId) {
  return llamarApi(`/tickets/${encodeURIComponent(id)}/asignar`, { metodo: 'PATCH', cuerpo: { tecnicoId } })
}

// PATCH /tickets/:id/cancelar (ADMIN) → ticket actualizado (estado CANCELADO)
export function cancelarTicket(id, motivo) {
  return llamarApi(`/tickets/${encodeURIComponent(id)}/cancelar`, { metodo: 'PATCH', cuerpo: { motivo } })
}
