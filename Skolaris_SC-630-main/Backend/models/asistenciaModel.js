const mongoose = require('mongoose');

const asistenciaSchema = new mongoose.Schema({
    // Referencia a la clase (Materia, Grupo, Horario)
    claseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Clase', 
        required: true 
    },
    // Referencia al estudiante
    estudianteId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    // Fecha en que se tomó la asistencia
    fecha: { 
        type: Date, 
        required: true 
    },
    // Estado de la asistencia
    estado: { 
        type: String,
        enum: ['Presente', 'Ausente', 'Tarde', 'Justificado'], // Opciones válidas
        required: true 
    }
}, { timestamps: true });

//Índice para asegurar que un estudiante solo tenga un registro por clase y día
asistenciaSchema.index({ claseId: 1, estudianteId: 1, fecha: 1 }, { unique: true });

module.exports = mongoose.model('Asistencia', asistenciaSchema, 'asistencias');