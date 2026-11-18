import { llamarApi } from './cliente.js'

// POST /api/auth/login → { token, usuario: { id, nombre, correo, rol } }
export function login(correo, contrasena) {
  return llamarApi('/api/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena }, publica: true })
}

// POST /api/auth/cambiar-contrasena → { mensaje }
// 401 { mensaje: 'La contraseña actual no es correcta' }
export function cambiarContrasena(correo, actual, nueva) {
  return llamarApi('/api/auth/cambiar-contrasena', { metodo: 'POST', cuerpo: { correo, actual, nueva }, publica: true })
}
