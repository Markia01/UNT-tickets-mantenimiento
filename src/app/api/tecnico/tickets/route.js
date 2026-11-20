import { DIA_MS } from '@/lib/api/config.js'
import { consultaDe, json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'
import { cargarTickets, tiempo } from '@/lib/api/tickets.js'

const DIAS_CERRADOS_RECIENTES = 7

const VISTAS = {
  asignados: (t) => t.estado === 'ASIGNADO',
  proceso: (t) => t.estado === 'EN_PROCESO',
  cerrados: (t, ahora) => t.estado === 'CERRADO' && ahora - tiempo(t.cerradoEn) <= DIAS_CERRADOS_RECIENTES * DIA_MS,
}

// GET /api/tecnico/tickets?vista=asignados|proceso|cerrados (TECNICO) → { datos, conteos }
export const GET = manejar(async (request) => {
  const tecnico = await exigirSesion(request, ['TECNICO'])
  const consulta = consultaDe(request)
  const ahora = Date.now()
  const vista = VISTAS[consulta.vista] ? consulta.vista : 'asignados'

  const mios = await cargarTickets({
    'tecnico.id': String(tecnico._id),
    estado: { $in: ['ASIGNADO', 'EN_PROCESO', 'CERRADO'] },
  })

  const conteos = {}
  for (const [clave, cumple] of Object.entries(VISTAS)) conteos[clave] = mios.filter((t) => cumple(t, ahora)).length

  const datos = mios
    .filter((t) => VISTAS[vista](t, ahora))
    .sort((a, b) =>
      vista === 'cerrados' ? tiempo(b.cerradoEn) - tiempo(a.cerradoEn) : tiempo(a.venceEn) - tiempo(b.venceEn),
    )
  return json({ datos, conteos })
})
