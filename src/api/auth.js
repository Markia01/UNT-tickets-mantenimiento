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

// POST /api/auth/registro { nombre, correo, tipo, contrasena } → 201 { token, usuario }
// La cuenta nueva siempre es REPORTANTE. 409 si el correo ya tiene cuenta.
export function registrar({ nombre, correo, tipo, contrasena }) {
  return llamarApi('/api/auth/registro', { metodo: 'POST', cuerpo: { nombre, correo, tipo, contrasena }, publica: true })
}
