import { Foto } from '@/models/index.js'
import { ErrorApi, esObjectId, manejar } from '@/lib/api/respuestas.js'

// GET /api/fotos/:id → la imagen. Sin token: un <img> no puede mandar el encabezado
// Authorization. El id es aleatorio y no se puede adivinar.
export const GET = manejar(async (_request, { params }) => {
  const { id } = await params
  const foto = esObjectId(id) ? await Foto.findById(id).lean() : null
  if (!foto) throw new ErrorApi(404, 'Esta foto no existe.')

  return new Response(foto.datos.buffer ?? foto.datos, {
    headers: {
      'Content-Type': foto.tipoContenido,
      'Content-Length': String(foto.tamano),
      // Una foto nunca cambia: el navegador la puede guardar
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      // Aunque alguien abra la foto directo, el navegador no ejecuta nada de su contenido
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; sandbox",
    },
  })
})
