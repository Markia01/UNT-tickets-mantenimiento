import mongoose from 'mongoose'

// Colección "categorias". No se borran: se desactivan (activa: false).
const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    // Nombre sin acentos ni mayúsculas, para que "computo" y "Cómputo" no se repitan
    nombreNormalizado: { type: String, required: true, unique: true },
    horasObjetivo: { type: Number, required: true, min: 1 },
    activa: { type: Boolean, default: true },
  },
  { collection: 'categorias', timestamps: true },
)

export default mongoose.models.Categoria ?? mongoose.model('Categoria', categoriaSchema)
