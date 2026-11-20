import { Usuario } from '@/models/index.js'
import { ErrorApi, esObjectId, limpiarEspacios } from './respuestas.js'

export const ROLES_ASIGNABLES = ['ADMIN', 'TECNICO']
const MAX_NOMBRE = 80

export function validarNombre(valor) {
  const nombre = limpiarEspacios(valor)
  if (nombre.length < 3) throw new ErrorApi(400, 'Escribe el nombre completo.')
  if (nombre.length > MAX_NOMBRE) throw new ErrorApi(400, `El nombre no puede pasar de ${MAX_NOMBRE} caracteres.`)
  return nombre
}

export function validarRol(rol) {
  if (!ROLES_ASIGNABLES.includes(rol)) throw new ErrorApi(400, 'Elige si es técnico o administrador.')
  return rol
}

// Usuario (documento) o 404
export async function usuarioDoc(id) {
  const usuario = esObjectId(id) ? await Usuario.findById(id) : null
  if (!usuario) throw new ErrorApi(404, 'Este usuario no existe.')
  return usuario
}
