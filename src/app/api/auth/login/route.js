import { Usuario } from '@/models/index.js'
import { contrasenaCorrecta, respuestaSesion } from '@/lib/api/sesion.js'
import { ErrorApi, json, leerJson, manejar } from '@/lib/api/respuestas.js'
import { limpiarCorreo } from '@/utils/correo.js'

// POST /api/auth/login { correo, contrasena } → { token, usuario }
export const POST = manejar(async (request) => {
  const cuerpo = await leerJson(request)
  const usuario = await Usuario.findOne({ correo: limpiarCorreo(cuerpo.correo) })
  if (!usuario || !(await contrasenaCorrecta(cuerpo.contrasena, usuario.contrasenaHash))) {
    throw new ErrorApi(401, 'Correo o contraseña incorrectos')
  }
  if (!usuario.activo) {
    throw new ErrorApi(403, 'Tu cuenta está desactivada. Pide ayuda al área de mantenimiento.')
  }
  return json(respuestaSesion(usuario))
})
