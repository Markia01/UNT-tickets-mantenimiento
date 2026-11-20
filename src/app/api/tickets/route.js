import { Categoria, Equipo, Ticket } from '@/models/index.js'
import { siguienteValor } from '@/models/Contador.js'
import { HORA_MS } from '@/lib/api/config.js'
import { rangoDelDia } from '@/lib/api/fechas.js'
import { copiaCategoria } from '@/lib/api/formatos.js'
import { guardarFoto, validarFoto } from '@/lib/api/fotos.js'
import { ErrorApi, consultaDe, esObjectId, json, leerFormulario, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion, persona } from '@/lib/api/sesion.js'
import { activoDeEquipo, cargarTickets, esActivo, guardarTicket, tiempo } from '@/lib/api/tickets.js'
import { calcularSemaforo } from '@/utils/semaforo.js'

const POR_PAGINA = 10
const MAX_POR_PAGINA = 50
const VISTAS = ['todos', 'activos', 'cerrados']
const TIEMPOS = ['A_TIEMPO', 'POR_VENCER', 'VENCIDO']
const MIN_DESCRIPCION = 15
const MAX_DESCRIPCION = 1000

const entero = (valor, porDefecto) => {
  const n = Number.parseInt(valor, 10)
  return Number.isFinite(n) && n > 0 ? n : porDefecto
}

// Activos primero, por venceEn (más urgentes primero); luego Cerrados y Cancelados, por cerradoEn (recientes primero)
function compararTickets(a, b) {
  const aActivo = esActivo(a)
  const bActivo = esActivo(b)
  if (aActivo !== bActivo) return aActivo ? -1 : 1
  if (aActivo) return tiempo(a.venceEn) - tiempo(b.venceEn)
  return tiempo(b.cerradoEn) - tiempo(a.cerradoEn)
}

// GET /api/tickets (ADMIN) → { datos, total, pagina, porPagina, conteos }. Filtros en docs/api.md.
export const GET = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  const consulta = consultaDe(request)
  const ahora = new Date()

  const vista = VISTAS.includes(consulta.vista) ? consulta.vista : 'todos'
  const folio = String(consulta.q ?? '').replace(/[#\s]/g, '')
  const tiempoBuscado = TIEMPOS.includes(consulta.tiempo) ? consulta.tiempo : null

  // Lo que se puede filtrar en la base; el resto (edificio, semáforo, fechas) se filtra después
  const filtro = {}
  if (folio) filtro._id = /^\d+$/.test(folio) ? Number(folio) : -1
  if (consulta.categoria) filtro['categoria.id'] = consulta.categoria
  if (consulta.tecnico === 'sin') filtro.tecnico = null
  else if (consulta.tecnico) filtro['tecnico.id'] = consulta.tecnico

  // desde/hasta son días completos en hora de Nayarit (hasta incluido). Los activos se
  // comparan por creadoEn y los Cerrados o Cancelados por cerradoEn.
  const desde = rangoDelDia(consulta.desde)?.desde
  const hasta = rangoDelDia(consulta.hasta)?.hasta
  const fechaFiltro = (t) => (esActivo(t) ? t.creadoEn : t.cerradoEn)

  const filtrados = (await cargarTickets(filtro)).filter((t) => {
    if (consulta.edificio && t.equipo?.ubicacion.edificio !== consulta.edificio) return false
    if (tiempoBuscado && calcularSemaforo(t, ahora) !== tiempoBuscado) return false
    if (desde || hasta) {
      const fecha = fechaFiltro(t)
      if (!fecha) return false
      if (desde && tiempo(fecha) < desde.getTime()) return false
      if (hasta && tiempo(fecha) >= hasta.getTime()) return false
    }
    return true
  })

  const activos = filtrados.filter(esActivo)
  const cerrados = filtrados.filter((t) => !esActivo(t))
  const enVista = { todos: filtrados, activos, cerrados }[vista].toSorted(compararTickets)

  const porPagina = Math.min(entero(consulta.porPagina, POR_PAGINA), MAX_POR_PAGINA)
  const ultimaPagina = Math.max(1, Math.ceil(enVista.length / porPagina))
  const pagina = Math.min(entero(consulta.pagina, 1), ultimaPagina)

  return json({
    datos: enVista.slice((pagina - 1) * porPagina, pagina * porPagina),
    total: enVista.length,
    pagina,
    porPagina,
    conteos: { todos: filtrados.length, activos: activos.length, cerrados: cerrados.length },
  })
})

// POST /api/tickets (REPORTANTE, multipart/form-data): equipoId, categoriaId, descripcion, foto?, esFallaDistinta?
export const POST = manejar(async (request) => {
  const usuario = await exigirSesion(request, ['REPORTANTE'])
  const formulario = await leerFormulario(request)
  const texto = (nombre) => String(formulario.get(nombre) ?? '')

  const equipoId = texto('equipoId')
  const equipo = esObjectId(equipoId) ? await Equipo.findById(equipoId) : null
  if (!equipo || equipo.estado !== 'ACTIVO') throw new ErrorApi(400, 'Elige un equipo válido.')

  const categoriaId = texto('categoriaId')
  const categoria = esObjectId(categoriaId) ? await Categoria.findById(categoriaId) : null
  if (!categoria || !categoria.activa) throw new ErrorApi(400, 'Elige la categoría de la falla.')

  const descripcion = texto('descripcion').trim()
  if (descripcion.length < MIN_DESCRIPCION) {
    throw new ErrorApi(400, `Describe la falla con al menos ${MIN_DESCRIPCION} caracteres.`)
  }
  if (descripcion.length > MAX_DESCRIPCION) {
    throw new ErrorApi(400, `La descripción no puede pasar de ${MAX_DESCRIPCION} caracteres.`)
  }

  const foto = validarFoto(formulario.get('foto'))

  // Evita duplicados: si el equipo ya tiene un reporte activo, hay que sumarse a ese
  // o confirmar que es una falla distinta
  const activo = await activoDeEquipo(equipo._id)
  if (activo && texto('esFallaDistinta') !== 'true') {
    throw new ErrorApi(
      409,
      `Ya hay un reporte activo de este equipo (#${activo.id}). Súmate a ese reporte o indica que es una falla distinta.`,
      { ticketId: activo.id },
    )
  }

  const creadoEn = new Date()
  const quien = persona(usuario)
  const ticket = new Ticket({
    _id: await siguienteValor('tickets'),
    descripcion,
    estado: 'ABIERTO',
    equipo: equipo._id,
    categoria: copiaCategoria(categoria),
    reporta: { ...quien, tipo: usuario.tipo ?? null },
    tecnico: null,
    fotoReporte: foto ? await guardarFoto(foto) : null,
    creadoEn,
    venceEn: new Date(creadoEn.getTime() + categoria.horasObjetivo * HORA_MS),
    historial: [{ estado: 'ABIERTO', usuario: quien, comentario: null, fecha: creadoEn }],
    sumados: [],
  })
  return json(await guardarTicket(ticket), 201)
})
