import { errorCorreo } from '../../utils/correo.js'

// Usuarios de prueba. La contraseña de todos es "demo1234".
// Los REPORTANTE tienen además `tipo`: Alumno, Docente o Personal.
export const usuariosMock = [
  {
    id: 'u1',
    nombre: 'Administración de Mantenimiento',
    correo: 'admin@utnay.edu.mx',
    rol: 'ADMIN',
    contrasena: 'demo1234',
    activo: true,
  },
  {
    id: 'u2',
    nombre: '[TÉCNICO 2]',
    correo: 'tecnico2@utnay.edu.mx',
    rol: 'TECNICO',
    contrasena: 'demo1234',
    activo: true,
  },
  {
    id: 'u3',
    nombre: 'Docente de prueba',
    correo: 'docente@utnay.edu.mx',
    rol: 'REPORTANTE',
    tipo: 'Docente',
    contrasena: 'demo1234',
    activo: true,
  },
  {
    id: 'u4',
    nombre: '[TÉCNICO 1]',
    correo: 'tecnico1@utnay.edu.mx',
    rol: 'TECNICO',
    contrasena: 'demo1234',
    activo: true,
  },
  // Quienes reportan los tickets de prueba (src/api/mocks/tickets.js)
  {
    id: 'u5',
    nombre: '[ALUMNO 1]',
    correo: 'alumno1@utnay.edu.mx',
    rol: 'REPORTANTE',
    tipo: 'Alumno',
    contrasena: 'demo1234',
    activo: true,
  },
  {
    id: 'u6',
    nombre: '[PERSONAL 1]',
    correo: 'personal1@utnay.edu.mx',
    rol: 'REPORTANTE',
    tipo: 'Personal',
    contrasena: 'demo1234',
    activo: true,
  },
  {
    id: 'u7',
    nombre: '[DOCENTE 2]',
    correo: 'docente2@utnay.edu.mx',
    rol: 'REPORTANTE',
    tipo: 'Docente',
    contrasena: 'demo1234',
    activo: true,
  },
  {
    id: 'u8',
    nombre: '[ALUMNO 2]',
    correo: 'alumno2@utnay.edu.mx',
    rol: 'REPORTANTE',
    tipo: 'Alumno',
    contrasena: 'demo1234',
    activo: true,
  },
  // Desactivado: no puede iniciar sesión ni aparece para asignar tickets
  {
    id: 'u9',
    nombre: '[TÉCNICO 3]',
    correo: 'tecnico3@utnay.edu.mx',
    rol: 'TECNICO',
    contrasena: 'demo1234',
    activo: false,
  },
]

// Usuario sin contraseña, como lo devuelve la API
export function sinContrasena({ contrasena: _contrasena, ...usuario }) {
  return usuario
}

// En modo mock el token es "token-de-prueba-<id del usuario>".
// Un usuario desactivado ya no tiene sesión válida (la API responde 401).
export function usuarioDeToken(token) {
  const id = token?.replace('token-de-prueba-', '')
  return usuariosMock.find((u) => u.id === id && u.activo) ?? null
}

const siguienteId = () => `u${Math.max(0, ...usuariosMock.map((u) => Number(u.id.slice(1)) || 0)) + 1}`
const TIPOS = ['Alumno', 'Docente', 'Personal']
const error = (status, mensaje) => ({ status, datos: { mensaje } })

// POST /api/auth/registro { nombre, correo, tipo, contrasena } → 201 { token, usuario }
export function registrarUsuario(cuerpo) {
  const nombre = String(cuerpo?.nombre ?? '').trim()
  const correo = String(cuerpo?.correo ?? '').trim().toLowerCase()
  const contrasena = String(cuerpo?.contrasena ?? '')

  if (nombre.length < 3) return error(400, 'Escribe tu nombre completo.')
  const errorDeCorreo = errorCorreo(correo)
  if (errorDeCorreo) return error(400, errorDeCorreo)
  if (!TIPOS.includes(cuerpo?.tipo)) return error(400, 'Elige si eres alumno, docente o personal.')
  if (contrasena.length < 8) return error(400, 'La contraseña debe tener al menos 8 caracteres.')
  if (usuariosMock.some((u) => u.correo === correo)) return error(409, 'Ya existe una cuenta con ese correo.')

  const usuario = {
    id: siguienteId(),
    nombre,
    correo,
    rol: 'REPORTANTE',
    tipo: cuerpo.tipo,
    contrasena,
    activo: true,
  }
  // Se guarda en memoria: dura hasta recargar la página
  usuariosMock.push(usuario)
  return { status: 201, datos: { token: `token-de-prueba-${usuario.id}`, usuario: sinContrasena(usuario) } }
}
