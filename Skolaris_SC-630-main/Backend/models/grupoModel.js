const mongoose = require('mongoose');

const grupoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  grado: { type: mongoose.Schema.Types.ObjectId, ref: 'Grado' },
  cantidad_estudiantes: Number,
  turno: { type: String, enum: ['Mañana', 'Tarde'] },
  estudiantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }] // 👈 nuevo campo
});

module.exports = mongoose.model('Grupo', grupoSchema);
