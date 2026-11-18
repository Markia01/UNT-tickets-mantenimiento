import { aQuery, llamarApi } from './cliente.js'

// GET /api/tickets (ADMIN) → { datos: [ticket], total, pagina, porPagina, conteos }
// Parámetros: vista, q, desde, hasta, edificio, categoria, tiempo, tecnico, pagina, porPagina.
// Detalle en docs/api.md.
export function getTickets(filtros) {
  return llamarApi(`/api/tickets${aQuery(filtros)}`)
}

// GET /api/catalogos (cualquier rol)
// → { edificios: [string], tiposEquipo: [string], categorias: [{ id, nombre, horasObjetivo }],
//     equipos: [{ id, tipo, descripcion, ubicacion: { edificio, aula } }] (solo activos) }
export function getCatalogos() {
  return llamarApi('/api/catalogos')
}

// GET /api/tickets/:id → ticket completo. 404 si no existe.
// ADMIN: cualquiera · TECNICO: los asignados a él · REPORTANTE: los que reportó o a los que se sumó (si no, 403).
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

// ---------- Quien reporta (REPORTANTE) ----------

// GET /api/tickets/activo?equipoId= → { ticket: Ticket | null }: el reporte activo de ese equipo, si hay
export function getTicketActivo(equipoId) {
  return llamarApi(`/api/tickets/activo${aQuery({ equipoId })}`)
}

// POST /api/tickets (multipart/form-data) → 201 ticket creado (estado ABIERTO)
// Campos: equipoId, categoriaId, descripcion, foto (opcional), esFallaDistinta ("true" para
// crearlo aunque el equipo ya tenga un reporte activo). 409 { mensaje, ticketId } si es duplicado.
export function crearReporte({ equipoId, categoriaId, descripcion, foto, esFallaDistinta = false }) {
  const formulario = new FormData()
  formulario.append('equipoId', equipoId)
  formulario.append('categoriaId', categoriaId)
  formulario.append('descripcion', descripcion)
  if (foto) formulario.append('foto', foto)
  if (esFallaDistinta) formulario.append('esFallaDistinta', 'true')
  return llamarApi('/api/tickets', { metodo: 'POST', cuerpo: formulario })
}

// POST /api/tickets/:id/sumarme → ticket actualizado (el usuario queda en `sumados`)
export function sumarmeAReporte(id) {
  return llamarApi(`/api/tickets/${encodeURIComponent(id)}/sumarme`, { metodo: 'POST' })
}

// GET /api/tickets/mios?estado=todos|activos|cerrados|cancelados
// → { datos: [Ticket + relacion: 'PROPIO' | 'SUMADO'], conteos: { todos, activos, cerrados, cancelados } }
export function getMisReportes(filtros) {
  return llamarApi(`/api/tickets/mios${aQuery(filtros)}`)
}
