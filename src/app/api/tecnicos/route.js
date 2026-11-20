import { Ticket, Usuario } from '@/models/index.js'
import { json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'
import { FILTRO_ACTIVOS } from '@/lib/api/tickets.js'

// GET /api/tecnicos (ADMIN) → [{ id, nombre, activos }]: técnicos activos con su carga, por nombre
export const GET = manejar(async (request) => {
  await exigirSesion(request, ['ADMIN'])
  const [tecnicos, carga] = await Promise.all([
    Usuario.find({ rol: 'TECNICO', activo: true }).lean(),
    Ticket.aggregate([{ $match: FILTRO_ACTIVOS }, { $group: { _id: '$tecnico.id', activos: { $sum: 1 } } }]),
  ])
  const porTecnico = new Map(carga.map((c) => [c._id, c.activos]))
  return json(
    tecnicos
      .map((t) => ({ id: String(t._id), nombre: t.nombre, activos: porTecnico.get(String(t._id)) ?? 0 }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  )
})
