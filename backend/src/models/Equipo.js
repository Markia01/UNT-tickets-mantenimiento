const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');

// La ubicación va dentro del equipo: en MongoDB no hace falta
// una colección aparte para edificios y aulas.
const equipoSchema = new Schema(
  {
    tipo: { type: String, required: true, trim: true }, // aire, proyector, PC...
    descripcion: { type: String, trim: true },
    ubicacion: {
      edificio: { type: String, required: true, trim: true },
      aula: { type: String, required: true, trim: true },
    },
    codigoQr: { type: String, unique: true, default: () => randomUUID() },
  },
  { timestamps: true },
);

module.exports = model('Equipo', equipoSchema);
