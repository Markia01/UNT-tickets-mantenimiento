import mongoose from 'mongoose'

// Colección "contadores": da folios consecutivos ({ _id: 'tickets', valor: 14 }).
const contadorSchema = new mongoose.Schema(
  {
    _id: { type: String },
    valor: { type: Number, default: 0 },
  },
  { collection: 'contadores', versionKey: false },
)

const Contador = mongoose.models.Contador ?? mongoose.model('Contador', contadorSchema)
export default Contador

// Siguiente número de la serie (atómico: dos reportes al mismo tiempo no comparten folio)
export async function siguienteValor(nombre) {
  const { valor } = await Contador.findByIdAndUpdate(
    nombre,
    { $inc: { valor: 1 } },
    { returnDocument: 'after', upsert: true },
  )
  return valor
}
