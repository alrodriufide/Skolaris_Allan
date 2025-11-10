const Materia = require('../models/materiaModel');

// Crear materia
const crearMateria = async (req, res) => {
  try {
    const materia = new Materia(req.body);
    await materia.save();
    res.status(201).json(materia);
  } catch (error) {
    console.error("Error en crearMateria:", error); // 👈 log real
    res.status(500).json({ error: 'Error al crear materia', detalle: error.message });
  }
};


// Obtener todas las materias
const obtenerMaterias = async (req, res) => {
  try {
    const materias = await Materia.find().lean();
    res.status(200).json(materias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener materias' });
  }
};

// Obtener una materia por ID
const obtenerMateriaPorId = async (req, res) => {
  try {
    const materia = await Materia.findById(req.params.id);
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    res.status(200).json(materia);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar materia' });
  }
};

// Actualizar materia
const actualizarMateria = async (req, res) => {
  try {
    const materia = await Materia.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    res.status(200).json(materia);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar materia' });
  }
};

// Eliminar materia
const eliminarMateria = async (req, res) => {
  try {
    await Materia.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Materia eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar materia' });
  }
};

module.exports = {
  crearMateria,
  obtenerMaterias,
  obtenerMateriaPorId,
  actualizarMateria,
  eliminarMateria,
};
