import { CLAVE_TOKEN } from '../api/cliente.js'

const CLAVE_USUARIO = 'usuario'
const SIN_SESION = { token: null, usuario: null }

// Sesión guardada en localStorage, leída con useSyncExternalStore.
// En el servidor no hay localStorage: ahí la sesión es `undefined` ("todavía no se sabe")
// y las pantallas esperan al navegador antes de decidir si mandan a /login.
let actual
const oyentes = new Set()

// El usuario se guarda junto al token para conservar el rol al recargar la página
// (la API no tiene todavía un endpoint /api/auth/me).
function leer() {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN)
    const usuario = JSON.parse(localStorage.getItem(CLAVE_USUARIO) ?? 'null')
    if (token && usuario?.rol) return { token, usuario }
  } catch {
    // Datos corruptos: se ignora la sesión guardada
  }
  return SIN_SESION
}

function cambiar(sesion) {
  actual = sesion
  oyentes.forEach((oyente) => oyente())
}

export function leerSesion() {
  if (actual === undefined) actual = leer()
  return actual
}

export function leerSesionServidor() {
  return undefined
}

export function suscribirSesion(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export function guardarSesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token)
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
  cambiar({ token, usuario })
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN)
  localStorage.removeItem(CLAVE_USUARIO)
  cambiar(SIN_SESION)
}
