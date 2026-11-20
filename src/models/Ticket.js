import mongoose from 'mongoose'

const { Schema } = mongoose

// { id, nombre } de un usuario, copiado al momento del cambio
const personaSchema = new Schema({ id: { type: String, required: true }, nombre: { type: String, required: true } }, { _id: false })

const entradaHistorialSchema = new Schema(
  {
    estado: { type: String, required: true },
    usuario: { type: personaSchema, required: true },
    // Solo en entradas ASIGNADO: a quién se asignó
    tecnico: { type: personaSchema, default: undefined },
    comentario: { type: String, default: null },
    fecha: { type: Date, required: true },
  },
  { _id: false },
)

// Colección "tickets". El _id es el folio consecutivo (#14), que da la colección "contadores".
const ticketSchema = new Schema(
  {
    _id: { type: Number },
    descripcion: { type: String, required: true },
    estado: {
      type: String,
      enum: ['ABIERTO', 'ASIGNADO', 'EN_PROCESO', 'CERRADO', 'CANCELADO'],
      default: 'ABIERTO',
    },
    // Referencia: si se edita el equipo, sus tickets muestran los datos nuevos
    equipo: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
    // Copia: editar la categoría después no cambia los tickets que ya existen
    categoria: {
      id: { type: String, required: true },
      nombre: { type: String, required: true },
      horasObjetivo: { type: Number, required: true },
    },
    reporta: {
      id: { type: String, required: true },
      nombre: { type: String, required: true },
      tipo: { type: String, default: null },
    },
    tecnico: { type: personaSchema, default: null },
    fotoReporte: { type: String, default: null },
    fotoCierre: { type: String, default: null },
    comentarioCierre: { type: String, default: null },
    motivoCancelacion: { type: String, default: null },
    creadoEn: { type: Date, required: true },
    venceEn: { type: Date, required: true },
    // Cuándo dejó de estar activo (cerrado o cancelado)
    cerradoEn: { type: Date, default: null },
    historial: { type: [entradaHistorialSchema], default: [] },
    sumados: { type: [personaSchema], default: [] },
  },
  { collection: 'tickets' },
)

ticketSchema.index({ estado: 1 })
ticketSchema.index({ equipo: 1 })
ticketSchema.index({ 'tecnico.id': 1 })
ticketSchema.index({ 'reporta.id': 1 })
ticketSchema.index({ 'sumados.id': 1 })

export default mongoose.models.Ticket ?? mongoose.model('Ticket', ticketSchema)
