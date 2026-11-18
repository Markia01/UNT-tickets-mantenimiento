import { asignarTecnico, cancelarTicket, listarTecnicos } from './accionesTickets.js'
import { calcularResumen } from './admin.js'
import { crearCategoria, editarCategoria, listarCategorias } from './categorias.js'
import { crearEquipo, editarEquipo, listarEquipos, obtenerConfiguracion, obtenerEquipo } from './equipos.js'
import { crearUsuario, editarUsuario, listarUsuarios, restablecerContrasena } from './gestionUsuarios.js'
import { buscarTickets, obtenerCatalogos } from './listaTickets.js'
import { crearReporte, listarMios, obtenerTicketPara, sumarseAReporte, ticketActivoDeEquipo } from './reportes.js'
import { cerrarTicket, listarTicketsTecnico, marcarEnProceso } from './tecnico.js'
import { registrarUsuario, sinContrasena, usuarioDeToken, usuariosMock } from './usuarios.js'

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
// - `params`: partes variables de la ruta (/api/tickets/:id → { id }).
const manejadores = {
  'POST /api/auth/login': ({ cuerpo }) => {
    const correo = String(cuerpo?.correo ?? '').trim().toLowerCase()
    const usuario = usuariosMock.find(
      (u) => u.correo === correo && u.contrasena === cuerpo?.contrasena,
    )
    if (!usuario) {
      return { status: 401, datos: { mensaje: 'Correo o contraseña incorrectos' } }
    }
    if (!usuario.activo) {
      return { status: 403, datos: { mensaje: 'Tu cuenta está desactivada. Pide ayuda al área de mantenimiento.' } }
    }
    return {
      status: 200,
      datos: { token: `token-de-prueba-${usuario.id}`, usuario: sinContrasena(usuario) },
    }
  },

  'POST /api/auth/registro': ({ cuerpo }) => registrarUsuario(cuerpo),

  'POST /api/auth/cambiar-contrasena': ({ cuerpo }) => {
    const correo = String(cuerpo?.correo ?? '').trim().toLowerCase()
    const nueva = String(cuerpo?.nueva ?? '')
    const usuario = usuariosMock.find((u) => u.correo === correo && u.contrasena === cuerpo?.actual)
    if (!usuario) {
      return { status: 401, datos: { mensaje: 'La contraseña actual no es correcta' } }
    }
    if (nueva.length < 8) {
      return { status: 400, datos: { mensaje: 'La nueva contraseña debe tener al menos 8 caracteres' } }
    }
    // Se cambia en memoria: dura hasta recargar la página
    usuario.contrasena = nueva
    return { status: 200, datos: { mensaje: 'Contraseña actualizada' } }
  },

  'GET /api/admin/resumen': conRol(['ADMIN'], () => ({ status: 200, datos: calcularResumen() })),

  'GET /api/tickets': conRol(['ADMIN'], ({ consulta }) => ({ status: 200, datos: buscarTickets(consulta) })),
  // Rutas fijas antes que /api/tickets/:id (si no, ":id" atraparía "activo" y "mios")
  'GET /api/tickets/activo': conRol(['REPORTANTE'], ({ consulta }) => ticketActivoDeEquipo(consulta)),
  'GET /api/tickets/mios': conRol(['REPORTANTE'], ({ consulta, usuario }) => listarMios(consulta, usuario)),
  'POST /api/tickets': conRol(['REPORTANTE'], ({ cuerpo, usuario }) => crearReporte(cuerpo, usuario)),
  'POST /api/tickets/:id/sumarme': conRol(['REPORTANTE'], ({ params, usuario }) => sumarseAReporte(params.id, usuario)),
  // Cualquier rol con sesión; obtenerTicketPara revisa qué tickets puede ver cada uno
  'GET /api/tickets/:id': conRol(null, ({ params, usuario }) => obtenerTicketPara(params.id, usuario)),
  'PATCH /api/tickets/:id/asignar': conRol(['ADMIN'], ({ params, cuerpo, usuario }) =>
    asignarTecnico(params.id, cuerpo, usuario),
  ),
  'PATCH /api/tickets/:id/cancelar': conRol(['ADMIN'], ({ params, cuerpo, usuario }) =>
    cancelarTicket(params.id, cuerpo, usuario),
  ),

  'PATCH /api/tickets/:id/en-proceso': conRol(['TECNICO'], ({ params, usuario }) => marcarEnProceso(params.id, usuario)),
  'PATCH /api/tickets/:id/cerrar': conRol(['TECNICO'], ({ params, cuerpo, usuario }) =>
    cerrarTicket(params.id, cuerpo, usuario),
  ),
  'GET /api/tecnico/tickets': conRol(['TECNICO'], ({ consulta, usuario }) => listarTicketsTecnico(consulta, usuario)),

  'GET /api/tecnicos': conRol(['ADMIN'], () => listarTecnicos()),

  'GET /api/catalogos': conRol(null, () => ({ status: 200, datos: obtenerCatalogos() })),

  'GET /api/equipos': conRol(['ADMIN'], ({ consulta }) => listarEquipos(consulta)),
  'GET /api/equipos/:id': conRol(['ADMIN'], ({ params }) => obtenerEquipo(params.id)),
  'POST /api/equipos': conRol(['ADMIN'], ({ cuerpo }) => crearEquipo(cuerpo)),
  'PATCH /api/equipos/:id': conRol(['ADMIN'], ({ params, cuerpo }) => editarEquipo(params.id, cuerpo)),

  'GET /api/configuracion': conRol(['ADMIN'], () => obtenerConfiguracion()),

  'GET /api/usuarios': conRol(['ADMIN'], ({ consulta }) => listarUsuarios(consulta)),
  'POST /api/usuarios': conRol(['ADMIN'], ({ cuerpo }) => crearUsuario(cuerpo)),
  'PATCH /api/usuarios/:id': conRol(['ADMIN'], ({ params, cuerpo, usuario }) => editarUsuario(params.id, cuerpo, usuario)),
  'POST /api/usuarios/:id/restablecer': conRol(['ADMIN'], ({ params }) => restablecerContrasena(params.id)),

  'GET /api/categorias': conRol(['ADMIN'], () => listarCategorias()),
  'POST /api/categorias': conRol(['ADMIN'], ({ cuerpo }) => crearCategoria(cuerpo)),
  'PATCH /api/categorias/:id': conRol(['ADMIN'], ({ params, cuerpo }) => editarCategoria(params.id, cuerpo)),
}

// "PATCH /api/tickets/:id/asignar" → { metodo, regex, nombres: ['id'], manejador }
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
