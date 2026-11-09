import { parsearFechaLocal } from '../../utils/fechas.js'
import { calcularSemaforo, esActivo } from '../../utils/semaforo.js'
import { categoriasMock, equiposMock, tiposEquipoMock } from './catalogos.js'
import { ticketsMock } from './tickets.js'

const POR_PAGINA = 10
const MAX_POR_PAGINA = 50
const VISTAS = ['todos', 'activos', 'cerrados']
const TIEMPOS = ['A_TIEMPO', 'POR_VENCER', 'VENCIDO']

const tiempo = (fecha) => new Date(fecha).getTime()

const entero = (valor, porDefecto) => {
  const n = Number.parseInt(valor, 10)
  return Number.isFinite(n) && n > 0 ? n : porDefecto
}

// Activos primero, por venceEn (más urgentes primero); luego Cerrados y
// Cancelados, por cerradoEn (más recientes primero).
function compararTickets(a, b) {
  const aActivo = esActivo(a)
  const bActivo = esActivo(b)
  if (aActivo !== bActivo) return aActivo ? -1 : 1
  if (aActivo) return tiempo(a.venceEn) - tiempo(b.venceEn)
  return tiempo(b.cerradoEn) - tiempo(a.cerradoEn)
}

// GET /tickets (ver docs/api.md)
export function buscarTickets(consulta = {}, tickets = ticketsMock, ahora = new Date()) {
  const vista = VISTAS.includes(consulta.vista) ? consulta.vista : 'todos'
  const id = String(consulta.q ?? '').replace(/[#\s]/g, '')
  const tiempoBuscado = TIEMPOS.includes(consulta.tiempo) ? consulta.tiempo : null

  // desde/hasta son días completos (hasta incluido). Los activos se comparan por
  // creadoEn (fecha del reporte); los Cerrados y Cancelados, por cerradoEn.
  const desde = parsearFechaLocal(consulta.desde)
  const hastaDia = parsearFechaLocal(consulta.hasta)
  const hasta = hastaDia && new Date(hastaDia.getFullYear(), hastaDia.getMonth(), hastaDia.getDate() + 1)
  const fechaFiltro = (t) => (esActivo(t) ? t.creadoEn : t.cerradoEn)

  // Todos los filtros menos la vista: con esto se calculan los conteos de las pestañas
  const filtrados = tickets.filter((t) => {
    if (id && t.id !== id) return false
    if (consulta.edificio && t.equipo.ubicacion.edificio !== consulta.edificio) return false
    if (consulta.categoria && t.categoria.id !== consulta.categoria) return false
    if (consulta.tecnico === 'sin' && t.tecnico) return false
    if (consulta.tecnico && consulta.tecnico !== 'sin' && t.tecnico?.id !== consulta.tecnico) return false
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

  return {
    datos: enVista.slice((pagina - 1) * porPagina, pagina * porPagina),
    total: enVista.length,
    pagina,
    porPagina,
    conteos: { todos: filtrados.length, activos: activos.length, cerrados: cerrados.length },
  }
}

// GET /catalogos
export function obtenerCatalogos() {
  const edificios = [...new Set(equiposMock.map((e) => e.ubicacion.edificio))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
  return { edificios, categorias: categoriasMock, tiposEquipo: tiposEquipoMock }
}
