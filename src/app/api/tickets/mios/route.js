import { consultaDe, json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'
import { cargarTickets, esActivo, relacion } from '@/lib/api/tickets.js'

const ESTADOS = {
  activos: (t) => esActivo(t),
  cerrados: (t) => t.estado === 'CERRADO',
  cancelados: (t) => t.estado === 'CANCELADO',
}

// GET /api/tickets/mios?estado=todos|activos|cerrados|cancelados (REPORTANTE)
// → { datos: [Ticket + relacion], conteos }
export const GET = manejar(async (request) => {
  const usuario = await exigirSesion(request, ['REPORTANTE'])
  const id = String(usuario._id)
  const { estado } = consultaDe(request)

  const mios = (await cargarTickets({ $or: [{ 'reporta.id': id }, { 'sumados.id': id }] }, { creadoEn: -1 })).map(
    (t) => ({ ...t, relacion: relacion(t, id) }),
  )

  const conteos = { todos: mios.length }
  for (const [clave, cumple] of Object.entries(ESTADOS)) conteos[clave] = mios.filter(cumple).length
  const filtro = ESTADOS[estado]
  return json({ datos: filtro ? mios.filter(filtro) : mios, conteos })
})
