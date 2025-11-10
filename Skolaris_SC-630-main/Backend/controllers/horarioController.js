const Horario = require('../models/horarioModel');

// Crear horario
const crearHorario = async (req, res) => {
  try {
    const horario = new Horario(req.body);
    await horario.save();
    res.status(201).json(horario);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear horario' });
  }
};

// Obtener todos los horarios
const obtenerHorarios = async (req, res) => {
  try {
    const horarios = await Horario.find();
    res.status(200).json(horarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
};

// Obtener un horario por ID
const obtenerHorarioPorId = async (req, res) => {
  try {
    const horario = await Horario.findById(req.params.id);
    if (!horario) return res.status(404).json({ error: 'Horario no encontrado' });
    res.status(200).json(horario);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar horario' });
  }
};

// Actualizar horario
const actualizarHorario = async (req, res) => {
  try {
    const horario = await Horario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!horario) return res.status(404).json({ error: 'Horario no encontrado' });
    res.status(200).json(horario);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar horario' });
  }
};

// Eliminar horario
const eliminarHorario = async (req, res) => {
  try {
    await Horario.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Horario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar horario' });
  }
};

// Obtener bloques por grupo (nuevo)
const obtenerBloquesPorGrupo = async (req, res) => {
  try {
    const grupoId = req.params.grupoId;
    if (!grupoId) return res.status(400).json({ error: 'Falta grupoId' });

    const bloques = await Horario.find({ grupoId }).sort({ dia: 1, horaInicio: 1 });
    res.status(200).json(bloques);
  } catch (error) {
    console.error('Error obtener bloques por grupo:', error);
    res.status(500).json({ error: 'Error al obtener bloques por grupo' });
  }
};

module.exports = {
  crearHorario,
  obtenerHorarios,
  obtenerHorarioPorId,
  actualizarHorario,
  eliminarHorario,
  obtenerBloquesPorGrupo
};