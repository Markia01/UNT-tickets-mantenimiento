import { llamarApi } from './cliente.js'

// Arma "?a=1&b=2" omitiendo los valores vacíos
function aQuery(parametros = {}) {
  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') query.set(clave, valor)
  }
  const texto = query.toString()
  return texto ? `?${texto}` : ''
}

// GET /tickets (ADMIN) → { datos: [ticket], total, pagina, porPagina, conteos }
// Parámetros: vista, q, desde, hasta, edificio, categoria, tiempo, tecnico, pagina, porPagina.
// Detalle en docs/api.md.
export function getTickets(filtros) {
  return llamarApi(`/tickets${aQuery(filtros)}`)
}

// GET /catalogos (cualquier rol) → { edificios: [string], categorias: [{ id, nombre, horasObjetivo }] }
export function getCatalogos() {
  return llamarApi('/catalogos')
}
