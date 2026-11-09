import { asignarTecnico, cancelarTicket, listarTecnicos, obtenerTicket } from './accionesTickets.js'
import { calcularResumen } from './admin.js'
import { buscarTickets, obtenerCatalogos } from './listaTickets.js'
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

// Cada manejador recibe { cuerpo, consulta, params, token, usuario } y devuelve
// { status, datos }, con la misma forma que respondería la API real (ver docs/api.md).
// - `consulta`: parámetros de la URL (?vista=activos&pagina=2) como objeto.
// - `params`: partes variables de la ruta (/tickets/:id → { id }).
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

  'GET /tickets': conRol(['ADMIN'], ({ consulta }) => ({ status: 200, datos: buscarTickets(consulta) })),
  'GET /tickets/:id': conRol(['ADMIN'], ({ params }) => obtenerTicket(params.id)),
  'PATCH /tickets/:id/asignar': conRol(['ADMIN'], ({ params, cuerpo, usuario }) =>
    asignarTecnico(params.id, cuerpo, usuario),
  ),
  'PATCH /tickets/:id/cancelar': conRol(['ADMIN'], ({ params, cuerpo, usuario }) =>
    cancelarTicket(params.id, cuerpo, usuario),
  ),

  'GET /tecnicos': conRol(['ADMIN'], () => listarTecnicos()),

  'GET /catalogos': conRol(null, () => ({ status: 200, datos: obtenerCatalogos() })),
}

// "PATCH /tickets/:id/asignar" → { metodo, regex, nombres: ['id'], manejador }
const rutas = Object.entries(manejadores).map(([clave, manejador]) => {
  const [metodo, patron] = clave.split(' ')
  const nombres = []
  const regex = new RegExp(
    `^${patron.replace(/:(\w+)/g, (_, nombre) => {
      nombres.push(nombre)
      return '([^/]+)'
    })}$`,
  )
  return { metodo, regex, nombres, manejador }
})

export function responderMock(metodo, ruta, { cuerpo, token }) {
  const [camino, query = ''] = ruta.split('?')
  for (const r of rutas) {
    if (r.metodo !== metodo) continue
    const coincidencia = r.regex.exec(camino)
    if (!coincidencia) continue
    const params = Object.fromEntries(r.nombres.map((n, i) => [n, decodeURIComponent(coincidencia[i + 1])]))
    const consulta = Object.fromEntries(new URLSearchParams(query))
    return r.manejador({ cuerpo, consulta, params, token })
  }
  return { status: 404, datos: { mensaje: `No hay mock para ${metodo} ${camino}` } }
}
