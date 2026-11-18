import { aQuery, llamarApi } from './cliente.js'

// ---------- Técnico (TECNICO) ----------

// GET /api/tecnico/tickets?vista=asignados|proceso|cerrados → { datos: [Ticket], conteos: { asignados, proceso, cerrados } }
// Solo los tickets asignados al técnico. asignados y proceso: por venceEn (los más urgentes primero);
// cerrados: los que cerró en los últimos 7 días, del más reciente al más antiguo.
export function getMisTickets(filtros) {
  return llamarApi(`/api/tecnico/tickets${aQuery(filtros)}`)
}

// PATCH /api/tickets/:id/en-proceso → ticket actualizado (estado EN_PROCESO)
export function marcarEnProceso(id) {
  return llamarApi(`/api/tickets/${encodeURIComponent(id)}/en-proceso`, { metodo: 'PATCH' })
}

// PATCH /api/tickets/:id/cerrar (multipart/form-data: foto obligatoria y comentario) → ticket actualizado (CERRADO)
export function cerrarTicket(id, { foto, comentario }) {
  const formulario = new FormData()
  formulario.append('foto', foto)
  formulario.append('comentario', comentario)
  return llamarApi(`/api/tickets/${encodeURIComponent(id)}/cerrar`, { metodo: 'PATCH', cuerpo: formulario })
}
