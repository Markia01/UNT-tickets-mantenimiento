const { Schema, model } = require('mongoose');

const ESTADOS = ['ABIERTO', 'ASIGNADO', 'EN_PROCESO', 'CERRADO'];

// Cada cambio de estado se guarda dentro del propio ticket.
const cambioEstadoSchema = new Schema(
  {
    estado: { type: String, enum: ESTADOS, required: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    comentario: { type: String, trim: true },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ticketSchema = new Schema(
  {
    equipo: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
    categoria: { type: Schema.Types.ObjectId, ref: 'Categoria', required: true },
    reporta: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    tecnico: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    descripcion: { type: String, required: true, trim: true },
    prioridad: { type: String, enum: ['BAJA', 'MEDIA', 'ALTA'], default: 'MEDIA' },
    estado: { type: String, enum: ESTADOS, default: 'ABIERTO' },
    fotoReporte: String,
    fotoCierre: String,
    venceEn: { type: Date, required: true },
    cerradoEn: Date,
    historial: [cambioEstadoSchema],
  },
  { timestamps: true }, // agrega createdAt y updatedAt
);

// Acelera la consulta del historial por equipo
ticketSchema.index({ equipo: 1, createdAt: -1 });

module.exports = model('Ticket', ticketSchema);
