const { Schema, model } = require('mongoose');

const usuarioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contrasenaHash: { type: String, required: true },
    rol: {
      type: String,
      enum: ['REPORTANTE', 'TECNICO', 'ADMIN'],
      default: 'REPORTANTE',
    },
  },
  { timestamps: true },
);

module.exports = model('Usuario', usuarioSchema);
