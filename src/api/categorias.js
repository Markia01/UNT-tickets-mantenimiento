import { llamarApi } from './cliente.js'

// GET /api/categorias (ADMIN) → [{ id, nombre, horasObjetivo, activa, ticketsActivos }], por nombre.
// Incluye las inactivas (GET /api/catalogos solo trae las activas).
export function getCategorias() {
  return llamarApi('/api/categorias')
}

// POST /api/categorias (ADMIN) { nombre, horasObjetivo } → categoría creada
export function crearCategoria(datos) {
  return llamarApi('/api/categorias', { metodo: 'POST', cuerpo: datos })
}

// PATCH /api/categorias/:id (ADMIN) { nombre?, horasObjetivo?, activa? } → categoría actualizada
export function editarCategoria(id, datos) {
  return llamarApi(`/api/categorias/${encodeURIComponent(id)}`, { metodo: 'PATCH', cuerpo: datos })
}
