import { llamarApi } from './cliente.js'

// GET /api/admin/resumen (ADMIN) → números y listas de la pantalla de Inicio.
// Forma de la respuesta en docs/api.md.
export function getResumen() {
  return llamarApi('/api/admin/resumen')
}
