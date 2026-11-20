import { Usuario } from '@/models/index.js'
import { aUsuario } from '@/lib/api/formatos.js'
import { ErrorApi, consultaDe, json, leerJson, manejar, normalizar } from '@/lib/api/respuestas.js'
import { cifrarContrasena, exigirSesion, generarContrasena } from '@/lib/api/sesion.js'
import { validarNombre, validarRol } from '@/lib/api/usuarios.js'
import { errorCorreo, limpiarCorreo } from '@/utils/correo.js'

const ROLES = ['ADMIN', 'TECNICO', 'REPORTANTE']
const YA_EXISTE = () => new ErrorApi(409, 'Ya existe una cuenta con ese correo.')

// GET /api/usuarios?q=&rol= (ADMIN) → [Usuario], por nombre (activos e inactivos)
export const GET = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  const consulta = consultaDe(request)
  const q = normalizar(consulta.q)
  const filtro = ROLES.includes(consulta.rol) ? { rol: consulta.rol } : {}

  const usuarios = await Usuario.find(filtro).lean()
  return json(
    usuarios
      .filter((u) => !q || normalizar(u.nombre).includes(q) || u.correo.includes(q))
      .map(aUsuario)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  )
})

// POST /api/usuarios { nombre, correo, rol } (ADMIN) → 201 { usuario, contrasenaTemporal }
// Solo técnicos y administradores; los reportantes se registran solos.
export const POST = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  const cuerpo = await leerJson(request)
  const nombre = validarNombre(cuerpo.nombre)
  const correo = limpiarCorreo(cuerpo.correo)
  const problemaCorreo = errorCorreo(correo)
  if (problemaCorreo) throw new ErrorApi(400, problemaCorreo)
  const rol = validarRol(cuerpo.rol)
  if (await Usuario.exists({ correo })) throw YA_EXISTE()

  const contrasenaTemporal = generarContrasena()
  try {
    const usuario = await Usuario.create({
      nombre,
      correo,
      rol,
      contrasenaHash: await cifrarContrasena(contrasenaTemporal),
    })
    return json({ usuario: aUsuario(usuario), contrasenaTemporal }, 201)
  } catch (error) {
    if (error?.code === 11000) throw YA_EXISTE()
    throw error
  }
})
