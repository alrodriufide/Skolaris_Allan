const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  cedula: String,
  fechaNacimiento: Date,
  edad: Number,
  direccion: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  contrasena: { type: String, required: true },
  rol: { 
    type: [String], // ✅ Ahora es un array de strings
    enum: ['Admin', 'Docente', 'Estudiante', 'Tutor'], // ✅ Incluye todos los posibles roles
    required: true 
  },
  activo: {
      type: Boolean,
      default: true // Mongoose usará 'true' si el campo no se especifica
  },
  grupo: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo' },
  grado: String,
  forzarCambioContrasena: Boolean,
});

module.exports = mongoose.model('Usuario', usuarioSchema, 'usuarios');

