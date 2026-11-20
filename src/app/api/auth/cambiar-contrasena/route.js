import { Usuario } from '@/models/index.js'
import { cifrarContrasena, contrasenaCorrecta } from '@/lib/api/sesion.js'
import { ErrorApi, json, leerJson, manejar } from '@/lib/api/respuestas.js'
import { limpiarCorreo } from '@/utils/correo.js'

// POST /api/auth/cambiar-contrasena { correo, actual, nueva } → { mensaje }
export const POST = manejar(async (request) => {
  const cuerpo = await leerJson(request)
  const usuario = await Usuario.findOne({ correo: limpiarCorreo(cuerpo.correo) })
  // No se dice si falló el correo o la contraseña
  if (!usuario || !(await contrasenaCorrecta(cuerpo.actual, usuario.contrasenaHash))) {
    throw new ErrorApi(401, 'La contraseña actual no es correcta')
  }
  const nueva = String(cuerpo.nueva ?? '')
  if (nueva.length < 8) throw new ErrorApi(400, 'La nueva contraseña debe tener al menos 8 caracteres')

  usuario.contrasenaHash = await cifrarContrasena(nueva)
  await usuario.save()
  return json({ mensaje: 'Contraseña actualizada' })
})
