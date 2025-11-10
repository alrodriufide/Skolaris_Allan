const Grado = require('../models/gradoModel');

// Crear grado
const crearGrado = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const nuevoGrado = await Grado.create({ nombre });
    return res.status(201).json(nuevoGrado);

  } catch (error) {
    console.error("❌ Error al crear grado:", error);
    return res.status(500).json({ error: "Error al crear grado" });
  }
};


// Obtener todos los grados
const obtenerGrados = async (req, res) => {
  try {
    const grados = await Grado.find();
    res.status(200).json(grados);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener grados' });
  }
};

// Actualizar grado por ID
const actualizarGrado = async (req, res) => {
  try {
    const gradoActualizado = await Grado.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!gradoActualizado) {
      return res.status(404).json({ error: 'Grado no encontrado' });
    }
    res.status(200).json(gradoActualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar grado' });
  }
};

// Eliminar grado por ID
const eliminarGrado = async (req, res) => {
  try {
    await Grado.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Grado eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar grado' });
  }
};

module.exports = {
  crearGrado,
  obtenerGrados,
  actualizarGrado,
  eliminarGrado,
};
