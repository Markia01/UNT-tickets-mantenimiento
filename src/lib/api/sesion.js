import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Usuario } from '@/models/index.js'
import { ErrorApi } from './respuestas.js'
import { aUsuario } from './formatos.js'

const DURACION_TOKEN = '12h'
const RONDAS_BCRYPT = 10

function secreto() {
  const valor = process.env.JWT_SECRET
  if (!valor) throw new Error('Falta la variable JWT_SECRET en el archivo .env.local')
  return valor
}

export const cifrarContrasena = (contrasena) => bcrypt.hash(contrasena, RONDAS_BCRYPT)
export const contrasenaCorrecta = (contrasena, hash) => bcrypt.compare(String(contrasena ?? ''), hash)

export const firmarToken = (usuario) => jwt.sign({ sub: String(usuario._id) }, secreto(), { expiresIn: DURACION_TOKEN })

// { token, usuario } como lo devuelven el login y el registro
export const respuestaSesion = (usuario) => ({ token: firmarToken(usuario), usuario: aUsuario(usuario) })

// Contraseña temporal de 10 caracteres, sin 0/O/1/l/I (se confunden al dictarla)
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
export function generarContrasena(largo = 10) {
  const azar = crypto.getRandomValues(new Uint32Array(largo))
  return Array.from(azar, (n) => LETRAS[n % LETRAS.length]).join('')
}

const NO_AUTORIZADO = () => new ErrorApi(401, 'Tu sesión expiró. Inicia sesión de nuevo.')

// Usuario de la petición (documento de Mongoose) según "Authorization: Bearer <token>".
// 401 sin token, con token inválido o vencido, o si el usuario ya no existe o está desactivado.
// Con `roles`, 403 si el rol del usuario no está en la lista.
export async function exigirSesion(request, roles = null) {
  const [esquema, token] = (request.headers.get('authorization') ?? '').split(' ')
  if (esquema !== 'Bearer' || !token) throw NO_AUTORIZADO()

  let datos
  try {
    datos = jwt.verify(token, secreto())
  } catch {
    throw NO_AUTORIZADO()
  }

  const usuario = await Usuario.findById(datos.sub)
  if (!usuario || !usuario.activo) throw NO_AUTORIZADO()
  if (roles && !roles.includes(usuario.rol)) throw new ErrorApi(403, 'No tienes permiso para esta acción.')
  return usuario
}

// { id, nombre } del usuario, para el historial y las referencias del ticket
export const persona = (usuario) => ({ id: String(usuario._id ?? usuario.id), nombre: usuario.nombre })
