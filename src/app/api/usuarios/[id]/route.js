import { Ticket } from '@/models/index.js'
import { aUsuario } from '@/lib/api/formatos.js'
import { ErrorApi, json, leerJson, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'
import { FILTRO_ACTIVOS } from '@/lib/api/tickets.js'
import { usuarioDoc, validarNombre, validarRol } from '@/lib/api/usuarios.js'

// PATCH /api/usuarios/:id { nombre?, rol?, activo? } (ADMIN) → Usuario
export const PATCH = manejar(async (request, { params }) => {
  const admin = await exigirSesion(request, ['ADMIN'])
  const { id } = await params
  const cuerpo = await leerJson(request)
  const usuario = await usuarioDoc(id)
  const esElMismo = String(usuario._id) === String(admin._id)

  const cambios = {}
  if (cuerpo.nombre !== undefined) cambios.nombre = validarNombre(cuerpo.nombre)
  // Mandar el mismo rol que ya tiene no cuenta como cambio
  if (cuerpo.rol !== undefined && cuerpo.rol !== usuario.rol) {
    cambios.rol = validarRol(cuerpo.rol)
    if (esElMismo) throw new ErrorApi(403, 'No puedes cambiar tu propio rol.')
  }
  if (cuerpo.activo !== undefined) {
    if (typeof cuerpo.activo !== 'boolean') throw new ErrorApi(400, 'Estado no válido.')
    if (!cuerpo.activo && esElMismo) throw new ErrorApi(403, 'No puedes desactivar tu propia cuenta.')
    cambios.activo = cuerpo.activo
  }

  // Un técnico que deja de serlo (o se desactiva) no puede quedarse con tickets activos
  if (usuario.rol === 'TECNICO' && (cambios.rol || cambios.activo === false)) {
    const pendientes = await Ticket.countDocuments({ ...FILTRO_ACTIVOS, 'tecnico.id': String(usuario._id) })
    if (pendientes > 0) {
      const tickets = pendientes === 1 ? '1 ticket activo' : `${pendientes} tickets activos`
      throw new ErrorApi(409, `Tiene ${tickets}. Reasígnalos a otro técnico antes de continuar.`)
    }
  }

  usuario.set(cambios)
  // Al pasar a técnico o administrador ya no es "Alumno/Docente/Personal"
  if (cambios.rol) usuario.tipo = undefined
  await usuario.save()
  return json(aUsuario(usuario))
})
