import { errorCorreo } from '../../utils/correo.js'
import { esActivo } from '../../utils/semaforo.js'
import { ticketsMock } from './tickets.js'
import { sinContrasena, usuariosMock } from './usuarios.js'

// GET/POST/PATCH /api/usuarios y POST /api/usuarios/:id/restablecer (ADMIN).
// Los cambios se guardan en `usuariosMock` (en memoria): duran hasta recargar la página.

const ROLES = ['ADMIN', 'TECNICO', 'REPORTANTE']
// Los reportantes se registran solos: aquí solo se crean (o se convierten en) técnicos y administradores
const ROLES_ASIGNABLES = ['ADMIN', 'TECNICO']
const MAX_NOMBRE = 80

const respuesta = (status, datos) => ({ status, datos })
const error = (status, mensaje) => respuesta(status, { mensaje })
const NO_EXISTE = error(404, 'Este usuario no existe.')

// "José Pérez" ≈ "jose perez"
const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

// Contraseña temporal de 10 caracteres, sin letras que se confunden (0/O, 1/l/I)
const ALFABETO = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generarContrasena(largo = 10) {
  const valores = crypto.getRandomValues(new Uint32Array(largo))
  return Array.from(valores, (v) => ALFABETO[v % ALFABETO.length]).join('')
}

const siguienteId = () => `u${Math.max(0, ...usuariosMock.map((u) => Number(u.id.slice(1)) || 0)) + 1}`
const ticketsActivosDe = (id) => ticketsMock.filter((t) => esActivo(t) && t.tecnico?.id === id).length

function validarNombre(valor) {
  const nombre = String(valor ?? '').trim().replace(/\s+/g, ' ')
  if (nombre.length < 3) return { mensaje: 'Escribe el nombre completo.' }
  if (nombre.length > MAX_NOMBRE) return { mensaje: `El nombre no puede pasar de ${MAX_NOMBRE} caracteres.` }
  return { nombre }
}

// GET /api/usuarios?q=&rol= → [Usuario], ordenados por nombre
export function listarUsuarios(consulta = {}) {
  const q = normalizar(consulta.q)
  const rol = ROLES.includes(consulta.rol) ? consulta.rol : null
  const usuarios = usuariosMock
    .filter((u) => !rol || u.rol === rol)
    .filter((u) => !q || normalizar(u.nombre).includes(q) || u.correo.includes(q))
    .map(sinContrasena)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return respuesta(200, usuarios)
}

// POST /api/usuarios { nombre, correo, rol } → 201 { usuario, contrasenaTemporal }
export function crearUsuario(cuerpo = {}) {
  const { nombre, mensaje } = validarNombre(cuerpo.nombre)
  if (mensaje) return error(400, mensaje)
  const correo = String(cuerpo.correo ?? '').trim().toLowerCase()
  const errorDeCorreo = errorCorreo(correo)
  if (errorDeCorreo) return error(400, errorDeCorreo)
  if (!ROLES_ASIGNABLES.includes(cuerpo.rol)) return error(400, 'Elige si es técnico o administrador.')
  if (usuariosMock.some((u) => u.correo === correo)) return error(409, 'Ya existe una cuenta con ese correo.')

  const contrasenaTemporal = generarContrasena()
  const usuario = { id: siguienteId(), nombre, correo, rol: cuerpo.rol, contrasena: contrasenaTemporal, activo: true }
  usuariosMock.push(usuario)
  return respuesta(201, { usuario: sinContrasena(usuario), contrasenaTemporal })
}

// PATCH /api/usuarios/:id { nombre?, rol?, activo? } → 200 Usuario
export function editarUsuario(id, cuerpo = {}, admin) {
  const usuario = usuariosMock.find((u) => u.id === id)
  if (!usuario) return NO_EXISTE

  const cambios = {}
  if (cuerpo.nombre !== undefined) {
    const { nombre, mensaje } = validarNombre(cuerpo.nombre)
    if (mensaje) return error(400, mensaje)
    cambios.nombre = nombre
  }
  if (cuerpo.rol !== undefined && cuerpo.rol !== usuario.rol) {
    if (!ROLES_ASIGNABLES.includes(cuerpo.rol)) return error(400, 'Elige si es técnico o administrador.')
    if (usuario.id === admin.id) return error(403, 'No puedes cambiar tu propio rol.')
    cambios.rol = cuerpo.rol
  }
  if (cuerpo.activo !== undefined) {
    if (typeof cuerpo.activo !== 'boolean') return error(400, 'Estado no válido.')
    if (!cuerpo.activo && usuario.id === admin.id) return error(403, 'No puedes desactivar tu propia cuenta.')
    cambios.activo = cuerpo.activo
  }

  // Un técnico que deja de serlo (o se desactiva) no puede quedarse con tickets activos
  const dejaDeAtender = usuario.rol === 'TECNICO' && (cambios.rol || cambios.activo === false)
  const pendientes = dejaDeAtender ? ticketsActivosDe(usuario.id) : 0
  if (pendientes > 0) {
    const tickets = pendientes === 1 ? '1 ticket activo' : `${pendientes} tickets activos`
    return error(409, `Tiene ${tickets}. Reasígnalos a otro técnico antes de continuar.`)
  }

  Object.assign(usuario, cambios)
  // Al pasar a técnico o administrador ya no es "Alumno/Docente/Personal"
  if (cambios.rol) delete usuario.tipo
  return respuesta(200, sinContrasena(usuario))
}

// POST /api/usuarios/:id/restablecer → 200 { contrasenaTemporal }
export function restablecerContrasena(id) {
  const usuario = usuariosMock.find((u) => u.id === id)
  if (!usuario) return NO_EXISTE
  usuario.contrasena = generarContrasena()
  return respuesta(200, { contrasenaTemporal: usuario.contrasena })
}
