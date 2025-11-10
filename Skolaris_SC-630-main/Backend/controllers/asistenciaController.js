const Asistencia = require('../models/asistenciaModel');
const mongoose = require('mongoose');

// Función principal para GUARDAR o MODIFICAR (usa "upsert")
exports.guardarAsistencia = async (req, res) => {
    // El frontend debe enviar: { claseId: '...', fecha: '...', asistencias: [...] }
    const { claseId, fecha, asistencias } = req.body; 

    if (!claseId || !fecha || !asistencias || !Array.isArray(asistencias)) {
        return res.status(400).json({ error: 'Datos incompletos.' });
    }

    try {
        //Normalizar la fecha esto para quitar las horas y los minutos
        const fechaBusqueda = new Date(fecha);
        fechaBusqueda.setHours(0, 0, 0, 0);

        const operaciones = asistencias.map(item => {
            if (!item.estudianteId || !item.estado) {
                throw new Error('Cada registro de asistencia debe tener estudianteId y estado.');
            }
            
            return {
                updateOne: {
                    filter: { 
                        claseId: new mongoose.Types.ObjectId(claseId),
                        estudianteId: new mongoose.Types.ObjectId(item.estudianteId),
                        fecha: fechaBusqueda
                    },
                    // $set actualiza solo los campos enviados (estado y observaciones)
                    update: { 
                        $set: { 
                            estado: item.estado,
                            observaciones: item.observaciones || ''
                        }
                    },
                    upsert: true //Crea el documento si no existe
                }
            };
        });

        //Ejecutamos todas las operaciones
        const resultado = await Asistencia.bulkWrite(operaciones);

        res.status(200).json({ message: 'Asistencia guardada correctamente', resultado });
    } catch (error) {
        console.error("Error al guardar asistencia:", error);
        res.status(500).json({ error: error.message || 'Error al guardar la asistencia' });
    }
};

//Función para OBTENER ASISTENCIA de una fecha (para el modal "Modificar")
exports.obtenerAsistenciaPorFecha = async (req, res) => {
    const { claseId, fecha } = req.query; 

    if (!claseId || !fecha) {
        return res.status(400).json({ error: 'Se requiere claseId y fecha.' });
    }

    try {
        const fechaBusqueda = new Date(fecha);
        fechaBusqueda.setHours(0, 0, 0, 0);

        const registros = await Asistencia.find({
            claseId: new mongoose.Types.ObjectId(claseId),
            fecha: fechaBusqueda
        }).populate('estudianteId', 'nombre apellido cedula'); //Trae los datos del estudiante

        res.status(200).json(registros);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la asistencia' });
    }
};

//Función NUEVA para OBTENER FECHAS (para el modal "Seleccionar fecha")
exports.obtenerFechasDeClase = async (req, res) => {
    const { claseId } = req.params; 

    try {
        //Busca en la colección, agrupa por fecha, y devuelve solo las fechas
        const fechas = await Asistencia.distinct("fecha", { 
            claseId: new mongoose.Types.ObjectId(claseId) 
        });
        
        if (!fechas) {
            return res.status(404).json({ message: 'No se encontraron fechas para esa clase.' });
        }
        
        //Ordenar fechas
        fechas.sort((a, b) => b - a); //Más recientes primero

        res.status(200).json(fechas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las fechas' });
    }
};