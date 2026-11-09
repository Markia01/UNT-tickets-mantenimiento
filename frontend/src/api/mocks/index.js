import { calcularResumen } from './admin.js'
import { sinContrasena, usuarioDeToken, usuariosMock } from './usuarios.js'

const NO_AUTORIZADO = { status: 401, datos: { mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' } }
const SIN_PERMISO = { status: 403, datos: { mensaje: 'No tienes permiso para esta acción.' } }

// Envuelve un manejador para exigir sesión y, opcionalmente, ciertos roles
function conRol(roles, manejador) {
  return (peticion) => {
    const usuario = usuarioDeToken(peticion.token)
    if (!usuario) return NO_AUTORIZADO
    if (roles && !roles.includes(usuario.rol)) return SIN_PERMISO
    return manejador({ ...peticion, usuario })
  }
}

// Cada manejador recibe { cuerpo, token } y devuelve { status, datos },
// con la misma forma que respondería la API real (ver docs/api.md).
const manejadores = {
  'POST /auth/login': ({ cuerpo }) => {
    const correo = String(cuerpo?.correo ?? '').trim().toLowerCase()
    const usuario = usuariosMock.find(
      (u) => u.correo === correo && u.contrasena === cuerpo?.contrasena,
    )
    if (!usuario) {
      return { status: 401, datos: { mensaje: 'Correo o contraseña incorrectos' } }
    }
    return {
      status: 200,
      datos: { token: `token-de-prueba-${usuario.id}`, usuario: sinContrasena(usuario) },
    }
  },

  'GET /admin/resumen': conRol(['ADMIN'], () => ({ status: 200, datos: calcularResumen() })),
}

export function responderMock(metodo, ruta, { cuerpo, token }) {
  const manejador = manejadores[`${metodo} ${ruta}`]
  if (!manejador) {
    return { status: 404, datos: { mensaje: `No hay mock para ${metodo} ${ruta}` } }
  }
  return manejador({ cuerpo, token })
}
