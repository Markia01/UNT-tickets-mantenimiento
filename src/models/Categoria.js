const { Schema, model } = require('mongoose');

const categoriaSchema = new Schema({
  nombre: { type: String, required: true, unique: true, trim: true }, // eléctrico, clima...
  horasObjetivo: { type: Number, required: true, min: 1 },
});

module.exports = model('Categoria', categoriaSchema);
