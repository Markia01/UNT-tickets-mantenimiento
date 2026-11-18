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
]

// Usuario sin contraseña, como lo devuelve la API
export function sinContrasena({ contrasena: _contrasena, ...usuario }) {
  return usuario
}

// En modo mock el token es "token-de-prueba-<id del usuario>"
export function usuarioDeToken(token) {
  const id = token?.replace('token-de-prueba-', '')
  return usuariosMock.find((u) => u.id === id) ?? null
}

const DOMINIO = '@utnay.edu.mx'
const TIPOS = ['Alumno', 'Docente', 'Personal']
const error = (status, mensaje) => ({ status, datos: { mensaje } })

// POST /api/auth/registro { nombre, correo, tipo, contrasena } → 201 { token, usuario }
export function registrarUsuario(cuerpo) {
  const nombre = String(cuerpo?.nombre ?? '').trim()
  const correo = String(cuerpo?.correo ?? '').trim().toLowerCase()
  const contrasena = String(cuerpo?.contrasena ?? '')

  if (nombre.length < 3) return error(400, 'Escribe tu nombre completo.')
  if (!correo.endsWith(DOMINIO) || correo.length <= DOMINIO.length) {
    return error(400, `El correo debe terminar en ${DOMINIO}`)
  }
  if (!TIPOS.includes(cuerpo?.tipo)) return error(400, 'Elige si eres alumno, docente o personal.')
  if (contrasena.length < 8) return error(400, 'La contraseña debe tener al menos 8 caracteres.')
  if (usuariosMock.some((u) => u.correo === correo)) return error(409, 'Ya existe una cuenta con ese correo.')

  const usuario = {
    id: `u${100 + usuariosMock.length}`,
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
