import { llamarApi } from './cliente.js'

// POST /auth/login → { token, usuario: { id, nombre, correo, rol } }
export function login(correo, contrasena) {
  return llamarApi('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena }, publica: true })
}

// POST /auth/cambiar-contrasena → { mensaje }
// 401 { mensaje: 'La contraseña actual no es correcta' }
export function cambiarContrasena(correo, actual, nueva) {
  return llamarApi('/auth/cambiar-contrasena', { metodo: 'POST', cuerpo: { correo, actual, nueva }, publica: true })
}
