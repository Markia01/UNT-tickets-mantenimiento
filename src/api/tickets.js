import { aQuery, llamarApi } from './cliente.js'

// GET /api/tickets (ADMIN) → { datos: [ticket], total, pagina, porPagina, conteos }
// Parámetros: vista, q, desde, hasta, edificio, categoria, tiempo, tecnico, pagina, porPagina.
// Detalle en docs/api.md.
export function getTickets(filtros) {
  return llamarApi(`/api/tickets${aQuery(filtros)}`)
}

// GET /api/catalogos (cualquier rol) → { edificios: [string], categorias: [{ id, nombre, horasObjetivo }] }
export function getCatalogos() {
  return llamarApi('/api/catalogos')
}

// GET /api/tickets/:id (ADMIN) → ticket completo. 404 si no existe.
export function getTicket(id) {
  return llamarApi(`/api/tickets/${encodeURIComponent(id)}`)
}

// GET /api/tecnicos (ADMIN) → [{ id, nombre, activos }] solo técnicos activos
export function getTecnicos() {
  return llamarApi('/api/tecnicos')
}

// PATCH /api/tickets/:id/asignar (ADMIN) → ticket actualizado (estado ASIGNADO)
export function asignarTecnico(id, tecnicoId) {
  return llamarApi(`/api/tickets/${encodeURIComponent(id)}/asignar`, { metodo: 'PATCH', cuerpo: { tecnicoId } })
}

// PATCH /api/tickets/:id/cancelar (ADMIN) → ticket actualizado (estado CANCELADO)
export function cancelarTicket(id, motivo) {
  return llamarApi(`/api/tickets/${encodeURIComponent(id)}/cancelar`, { metodo: 'PATCH', cuerpo: { motivo } })
}
