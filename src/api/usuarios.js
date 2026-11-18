import { aQuery, llamarApi } from './cliente.js'

// GET /api/usuarios?q=&rol= (ADMIN) → [usuario], ordenados por nombre.
// q busca en nombre y correo; rol: ADMIN | TECNICO | REPORTANTE.
export function getUsuarios(filtros) {
  return llamarApi(`/api/usuarios${aQuery(filtros)}`)
}

// POST /api/usuarios (ADMIN) { nombre, correo, rol: ADMIN | TECNICO } → { usuario, contrasenaTemporal }
export function crearUsuario(datos) {
  return llamarApi('/api/usuarios', { metodo: 'POST', cuerpo: datos })
}

// PATCH /api/usuarios/:id (ADMIN) { nombre?, rol?, activo? } → usuario actualizado
export function editarUsuario(id, datos) {
  return llamarApi(`/api/usuarios/${encodeURIComponent(id)}`, { metodo: 'PATCH', cuerpo: datos })
}

// POST /api/usuarios/:id/restablecer (ADMIN) → { contrasenaTemporal }
export function restablecerContrasena(id) {
  return llamarApi(`/api/usuarios/${encodeURIComponent(id)}/restablecer`, { metodo: 'POST' })
}
