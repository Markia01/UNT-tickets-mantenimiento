import { responderMock } from './mocks/index.js'

const USAR_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
const API_URL = import.meta.env.VITE_API_URL ?? ''
const RETRASO_MOCKS_MS = 600

export const CLAVE_TOKEN = 'token'

export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
  }
}

// AuthContext registra aquí su logout para que un 401 cierre la sesión.
let alNoAutorizado = null
export function registrarAlNoAutorizado(fn) {
  alNoAutorizado = fn
}

// Arma "?a=1&b=2" omitiendo los valores vacíos
export function aQuery(parametros = {}) {
  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') query.set(clave, valor)
  }
  const texto = query.toString()
  return texto ? `?${texto}` : ''
}

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms))

async function llamarMock(metodo, ruta, cuerpo, token) {
  await esperar(RETRASO_MOCKS_MS)
  // Copia profunda para que la página no pueda modificar los datos del mock
  const { status, datos } = responderMock(metodo, ruta, { cuerpo, token })
  return { status, datos: datos === undefined ? null : structuredClone(datos) }
}

async function llamarReal(metodo, ruta, cuerpo, token) {
  const headers = { Accept: 'application/json' }
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Inténtalo de nuevo.')
  }

  const texto = await respuesta.text()
  let datos = null
  if (texto) {
    try {
      datos = JSON.parse(texto)
    } catch {
      datos = { mensaje: texto }
    }
  }
  return { status: respuesta.status, datos }
}

// Llama a la API (o a los mocks) y devuelve el cuerpo de la respuesta.
// Lanza ApiError si la respuesta no es exitosa.
export async function llamarApi(ruta, { metodo = 'GET', cuerpo } = {}) {
  const token = localStorage.getItem(CLAVE_TOKEN)
  const { status, datos } = USAR_MOCKS
    ? await llamarMock(metodo, ruta, cuerpo, token)
    : await llamarReal(metodo, ruta, cuerpo, token)

  // Solo se cierra la sesión si había una; un 401 en el login es "credenciales incorrectas"
  if (status === 401 && token) alNoAutorizado?.()

  if (status < 200 || status >= 300) {
    throw new ApiError(status, datos?.mensaje ?? 'Ocurrió un error. Inténtalo de nuevo.')
  }
  return datos
}
