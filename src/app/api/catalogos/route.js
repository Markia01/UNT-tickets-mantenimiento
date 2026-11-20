import { Categoria, Equipo } from '@/models/index.js'
import { EDIFICIOS, TIPOS_EQUIPO } from '@/lib/api/config.js'
import { copiaCategoria } from '@/lib/api/formatos.js'
import { json, manejar } from '@/lib/api/respuestas.js'
import { exigirSesion } from '@/lib/api/sesion.js'

const porTexto = (a, b) => a.localeCompare(b, 'es')

// GET /api/catalogos (cualquier rol con sesión) → { edificios, tiposEquipo, categorias, equipos }
export const GET = manejar(async (request) => {
  await exigirSesion(request)

  const [edificiosUsados, categorias, equipos] = await Promise.all([
    Equipo.distinct('ubicacion.edificio'),
    Categoria.find({ activa: true }).lean(),
    Equipo.find({ estado: 'ACTIVO' }).lean(),
  ])

  return json({
    edificios: [...new Set([...EDIFICIOS, ...edificiosUsados])].sort(porTexto),
    tiposEquipo: [...TIPOS_EQUIPO].sort(porTexto),
    // Solo las activas: son las que se pueden elegir al reportar
    categorias: categorias.map(copiaCategoria).sort((a, b) => porTexto(a.nombre, b.nombre)),
    // Solo los activos, para el formulario edificio → aula → equipo
    equipos: equipos
      .map((e) => ({
        id: String(e._id),
        tipo: e.tipo,
        descripcion: e.descripcion,
        ubicacion: { edificio: e.ubicacion.edificio, aula: e.ubicacion.aula },
      }))
      .sort(
        (a, b) =>
          porTexto(a.ubicacion.edificio, b.ubicacion.edificio) ||
          a.ubicacion.aula.localeCompare(b.ubicacion.aula, 'es', { numeric: true }) ||
          porTexto(a.tipo, b.tipo),
      ),
  })
})
