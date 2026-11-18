// "Tickets" y "Equipos" en la ruta de navegación del detalle regresan a la lista
// con los mismos filtros con los que se dejó. La lista guarda su consulta al abrir
// un detalle y el detalle la lee (sessionStorage: dura mientras la pestaña esté abierta).
// Reemplaza el `state` de React Router, que Next no tiene.

const clave = (seccion) => `lista:${seccion}`

// seccion: 'tickets' | 'equipos'; consulta: "vista=activos&pagina=2" (sin "?")
export function guardarLista(seccion, consulta) {
  try {
    sessionStorage.setItem(clave(seccion), consulta ? `?${consulta}` : '')
  } catch {
    // Sin sessionStorage (modo privado estricto): se regresa a la lista sin filtros
  }
}

// Devuelve "?vista=activos&pagina=2" o '' si no hay nada guardado
export function leerLista(seccion) {
  try {
    return sessionStorage.getItem(clave(seccion)) ?? ''
  } catch {
    return ''
  }
}
