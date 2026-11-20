import { Usuario } from '@/models/index.js'
import { cifrarContrasena, respuestaSesion } from '@/lib/api/sesion.js'
import { ErrorApi, json, leerJson, limpiarEspacios, manejar } from '@/lib/api/respuestas.js'
import { errorCorreo, limpiarCorreo } from '@/utils/correo.js'
import { TIPOS_REPORTANTE } from '@/utils/usuario.js'

const MINIMO_CONTRASENA = 8
const YA_EXISTE = () => new ErrorApi(409, 'Ya existe una cuenta con ese correo.')

// POST /api/auth/registro { nombre, correo, tipo, contrasena } → 201 { token, usuario }
// La cuenta nueva siempre es REPORTANTE y solo se aceptan correos @utnay.edu.mx.
export const POST = manejar(async (request) => {
  const cuerpo = await leerJson(request)
  const nombre = limpiarEspacios(cuerpo.nombre)
  const correo = limpiarCorreo(cuerpo.correo)
  const contrasena = String(cuerpo.contrasena ?? '')

  if (nombre.length < 3) throw new ErrorApi(400, 'Escribe tu nombre completo.')
  const problemaCorreo = errorCorreo(correo)
  if (problemaCorreo) throw new ErrorApi(400, problemaCorreo)
  if (!TIPOS_REPORTANTE.includes(cuerpo.tipo)) throw new ErrorApi(400, 'Elige si eres alumno, docente o personal.')
  if (contrasena.length < MINIMO_CONTRASENA) {
    throw new ErrorApi(400, `La contraseña debe tener al menos ${MINIMO_CONTRASENA} caracteres.`)
  }
  if (await Usuario.exists({ correo })) throw YA_EXISTE()

  try {
    const usuario = await Usuario.create({
      nombre,
      correo,
      tipo: cuerpo.tipo,
      rol: 'REPORTANTE',
      contrasenaHash: await cifrarContrasena(contrasena),
    })
    return json(respuestaSesion(usuario), 201)
  } catch (error) {
    // Dos registros con el mismo correo al mismo tiempo: el índice único rechaza el segundo
    if (error?.code === 11000) throw YA_EXISTE()
    throw error
  }
})
