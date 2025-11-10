const mongoose = require('mongoose');

const claseSchema = new mongoose.Schema({
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true,
  },
  docente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  grupo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo',
    required: true,
  },
  horario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horario', // referencia a la colección Horario
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Clase', claseSchema);
