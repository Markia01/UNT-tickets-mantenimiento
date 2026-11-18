import { errorFoto, hayArchivo } from '../../utils/foto.js'
import { esActivo } from '../../utils/semaforo.js'
import { categoria, equipo } from './catalogos.js'
import { ticketsMock } from './tickets.js'

// Endpoints de quien reporta (y la lectura de un ticket según el rol).
// Los cambios se guardan en memoria: duran hasta recargar la página.

const HORA_MS = 60 * 60 * 1000
const MIN_DESCRIPCION = 15
const MAX_DESCRIPCION = 1000

const respuesta = (status, datos) => ({ status, datos })
const error = (status, mensaje, extra) => respuesta(status, { mensaje, ...extra })
const NO_EXISTE = error(404, 'Este ticket no existe.')

const persona = ({ id, nombre }) => ({ id, nombre })
const buscar = (id) => ticketsMock.find((t) => t.id === id)

// Lee un campo del cuerpo, venga como JSON o como FormData (multipart/form-data)
export function campo(cuerpo, nombre) {
  if (typeof FormData !== 'undefined' && cuerpo instanceof FormData) return cuerpo.get(nombre)
  return cuerpo?.[nombre]
}

// En los mocks la foto subida se muestra con una URL local del navegador;
// el backend real devuelve la URL donde la guardó (p. ej. /uploads/tickets/20-reporte.jpg)
export function urlFoto(archivo) {
  return URL.createObjectURL(archivo)
}

// 'PROPIO' si el usuario lo reportó, 'SUMADO' si se sumó, null si no tiene relación
export function relacion(ticket, usuario) {
  if (ticket.reporta.id === usuario.id) return 'PROPIO'
  if (ticket.sumados?.some((p) => p.id === usuario.id)) return 'SUMADO'
  return null
}

const activoDeEquipo = (equipoId) =>
  ticketsMock.filter((t) => t.equipo.id === equipoId && esActivo(t)).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))[0]

// GET /api/tickets/:id: ADMIN ve todos; TECNICO, los que tiene asignados;
// REPORTANTE, los que reportó o a los que se sumó
export function obtenerTicketPara(id, usuario) {
  const ticket = buscar(id)
  if (!ticket) return NO_EXISTE
  if (usuario.rol === 'TECNICO' && ticket.tecnico?.id !== usuario.id) {
    return error(403, 'Este ticket no está asignado a ti.')
  }
  if (usuario.rol === 'REPORTANTE' && !relacion(ticket, usuario)) {
    return error(403, 'No tienes permiso para ver este reporte.')
  }
  return respuesta(200, ticket)
}

// GET /api/tickets/activo?equipoId= → { ticket: Ticket | null }
export function ticketActivoDeEquipo(consulta) {
  if (!consulta.equipoId) return error(400, 'Falta el equipo.')
  if (!equipo(consulta.equipoId)) return error(404, 'Este equipo no existe.')
  return respuesta(200, { ticket: activoDeEquipo(consulta.equipoId) ?? null })
}

// POST /api/tickets (multipart/form-data): equipoId, categoriaId, descripcion, foto?, esFallaDistinta?
export function crearReporte(cuerpo, usuario) {
  const eq = equipo(String(campo(cuerpo, 'equipoId') ?? ''))
  if (!eq || eq.estado !== 'ACTIVO') return error(400, 'Elige un equipo válido.')

  const cat = categoria(String(campo(cuerpo, 'categoriaId') ?? ''))
  if (!cat) return error(400, 'Elige la categoría de la falla.')

  const descripcion = String(campo(cuerpo, 'descripcion') ?? '').trim()
  if (descripcion.length < MIN_DESCRIPCION) {
    return error(400, `Describe la falla con al menos ${MIN_DESCRIPCION} caracteres.`)
  }
  if (descripcion.length > MAX_DESCRIPCION) {
    return error(400, `La descripción no puede pasar de ${MAX_DESCRIPCION} caracteres.`)
  }

  const foto = campo(cuerpo, 'foto')
  const conFoto = hayArchivo(foto)
  const problemaFoto = conFoto ? errorFoto(foto) : undefined
  if (problemaFoto) return error(400, problemaFoto)

  // Evita duplicados: si el equipo ya tiene un reporte activo, hay que sumarse a ese
  // o confirmar que es una falla distinta
  const activo = activoDeEquipo(eq.id)
  if (activo && String(campo(cuerpo, 'esFallaDistinta')) !== 'true') {
    return error(409, `Ya hay un reporte activo de este equipo (#${activo.id}). Súmate a ese reporte o indica que es una falla distinta.`, {
      ticketId: activo.id,
    })
  }

  const ahora = new Date()
  const creadoEn = ahora.toISOString()
  const siguienteId = Math.max(...ticketsMock.map((t) => Number(t.id))) + 1
  const ticket = {
    id: String(siguienteId),
    descripcion,
    estado: 'ABIERTO',
    equipo: eq,
    categoria: cat,
    reporta: { id: usuario.id, nombre: usuario.nombre, tipo: usuario.tipo ?? null },
    tecnico: null,
    fotoReporte: conFoto ? urlFoto(foto) : null,
    fotoCierre: null,
    comentarioCierre: null,
    motivoCancelacion: null,
    creadoEn,
    venceEn: new Date(ahora.getTime() + cat.horasObjetivo * HORA_MS).toISOString(),
    cerradoEn: null,
    historial: [{ estado: 'ABIERTO', usuario: persona(usuario), comentario: null, fecha: creadoEn }],
    sumados: [],
  }
  ticketsMock.push(ticket)
  return respuesta(201, ticket)
}

// POST /api/tickets/:id/sumarme → el usuario se agrega a `sumados`
export function sumarseAReporte(id, usuario) {
  const ticket = buscar(id)
  if (!ticket) return NO_EXISTE
  if (!esActivo(ticket)) return error(409, 'Este reporte ya no está activo; si la falla sigue, repórtala de nuevo.')
  const yaEsta = relacion(ticket, usuario)
  if (yaEsta === 'PROPIO') return error(409, 'Tú hiciste este reporte.')
  if (yaEsta === 'SUMADO') return error(409, 'Ya te sumaste a este reporte.')
  ticket.sumados.push(persona(usuario))
  return respuesta(200, ticket)
}

const ESTADOS_MIOS = {
  activos: (t) => esActivo(t),
  cerrados: (t) => t.estado === 'CERRADO',
  cancelados: (t) => t.estado === 'CANCELADO',
}

// GET /api/tickets/mios?estado=todos|activos|cerrados|cancelados
// → { datos: [Ticket + relacion], conteos: { todos, activos, cerrados, cancelados } }
export function listarMios(consulta, usuario) {
  const mios = ticketsMock
    .filter((t) => relacion(t, usuario))
    .map((t) => ({ ...t, relacion: relacion(t, usuario) }))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))

  const filtro = ESTADOS_MIOS[consulta.estado]
  const conteos = { todos: mios.length }
  for (const [clave, cumple] of Object.entries(ESTADOS_MIOS)) conteos[clave] = mios.filter(cumple).length
  return respuesta(200, { datos: filtro ? mios.filter(filtro) : mios, conteos })
}
