import mongoose from 'mongoose'

// Colección "equipos". Un equipo dado de baja (BAJA) conserva su historial.
const equipoSchema = new mongoose.Schema(
  {
    tipo: { type: String, required: true },
    descripcion: { type: String, required: true, trim: true },
    ubicacion: {
      edificio: { type: String, required: true },
      aula: { type: String, required: true, trim: true },
    },
    estado: { type: String, enum: ['ACTIVO', 'BAJA'], default: 'ACTIVO' },
  },
  { collection: 'equipos', timestamps: true },
)

equipoSchema.index({ 'ubicacion.edificio': 1, 'ubicacion.aula': 1 })

export default mongoose.models.Equipo ?? mongoose.model('Equipo', equipoSchema)
