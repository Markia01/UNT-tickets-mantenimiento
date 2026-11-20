import { json, manejar } from '@/lib/api/respuestas.js'
import { cifrarContrasena, exigirSesion, generarContrasena } from '@/lib/api/sesion.js'
import { usuarioDoc } from '@/lib/api/usuarios.js'

// POST /api/usuarios/:id/restablecer (ADMIN) → { contrasenaTemporal } (la anterior deja de funcionar)
export const POST = manejar(async (request, { params }) => {
  await exigirSesion(request, ['ADMIN'])
  const { id } = await params
  const usuario = await usuarioDoc(id)
  const contrasenaTemporal = generarContrasena()
  usuario.contrasenaHash = await cifrarContrasena(contrasenaTemporal)
  await usuario.save()
  return json({ contrasenaTemporal })
})
