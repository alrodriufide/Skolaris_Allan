const mongoose = require('mongoose');

const diasValidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Acepta horas "7:00" o "07:00" con validación mm:ss
const horaRegex = /^([0-1]?\d|2[0-3]):([0-5]\d)$/;

const HorarioSchema = new mongoose.Schema({
  dia: { type: String, required: true, enum: diasValidos },
  horaInicio: { type: String, required: true, match: horaRegex },
  horaFin: { type: String, required: true, match: horaRegex },
  aula: { type: String },
  comentario: { type: String },
  grupoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo', required: false } 
}, { timestamps: true });

module.exports = mongoose.model('Horario', HorarioSchema);