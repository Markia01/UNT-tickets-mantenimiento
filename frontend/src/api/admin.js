import { llamarApi } from './cliente.js'

// GET /admin/resumen (ADMIN) → números y listas de la pantalla de Inicio.
// Forma de la respuesta en docs/api.md.
export function getResumen() {
  return llamarApi('/admin/resumen')
}
