import { llamarApi } from './cliente.js'

// POST /auth/login → { token, usuario: { id, nombre, correo, rol } }
export function login(correo, contrasena) {
  return llamarApi('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena } })
}
