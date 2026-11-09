import { usuariosMock } from './usuarios.js'

// Cada manejador recibe { cuerpo, token } y devuelve { status, datos },
// con la misma forma que respondería la API real.
const manejadores = {
  'POST /auth/login': ({ cuerpo }) => {
    const correo = String(cuerpo?.correo ?? '').trim().toLowerCase()
    const usuario = usuariosMock.find(
      (u) => u.correo === correo && u.contrasena === cuerpo?.contrasena,
    )
    if (!usuario) {
      return { status: 401, datos: { mensaje: 'Correo o contraseña incorrectos' } }
    }
    const { contrasena: _contrasena, ...datosUsuario } = usuario
    return {
      status: 200,
      datos: { token: `token-de-prueba-${usuario.id}`, usuario: datosUsuario },
    }
  },
}

export function responderMock(metodo, ruta, { cuerpo, token }) {
  const manejador = manejadores[`${metodo} ${ruta}`]
  if (!manejador) {
    return { status: 404, datos: { mensaje: `No hay mock para ${metodo} ${ruta}` } }
  }
  return manejador({ cuerpo, token })
}
