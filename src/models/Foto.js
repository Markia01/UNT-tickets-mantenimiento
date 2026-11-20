import mongoose from 'mongoose'

// Colección "fotos": las imágenes de reporte y de cierre (máximo 5 MB cada una).
// Se guardan en la base para que funcionen igual en cualquier servidor (no dependen de una
// carpeta del disco). Se sirven en GET /api/fotos/:id.
const fotoSchema = new mongoose.Schema(
  {
    tipoContenido: { type: String, required: true },
    datos: { type: Buffer, required: true },
    tamano: { type: Number, required: true },
    creadoEn: { type: Date, default: Date.now },
  },
  { collection: 'fotos' },
)

export default mongoose.models.Foto ?? mongoose.model('Foto', fotoSchema)
