const Clase = require('../models/claseModel');

const obtenerClases = async (req, res) => {
  try {
    const clases = await Clase.find()
      .populate('grupo')
      .populate('materia')
      .populate('horario')
      .populate("docente", "nombre apellido");
    res.status(200).json(clases);
  } catch (error) {
    console.error('Error al obtener clases:', error);
    res.status(500).json({ error: 'Error al obtener clases' });
  }
};

const obtenerClasePorId = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id)
      .populate({
        path: 'grupo',
        select: 'nombre grado turno estudiantes' // Trae solo lo que necesitas
      })
      .populate({
        path: 'materia',
        select: 'nombre'
      })
      .populate({
        path: 'docente',
        select: 'nombre apellido email'
      })
      .populate({
        path: 'horario',
        select: 'dia horaInicio horaFin'
      });

    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    res.status(200).json(clase);
  } catch (error) {
    console.error('Error al obtener clase:', error);
    res.status(500).json({ error: 'Error al obtener clase por ID' });
  }
};

const crearClase = async (req, res) => {
  try {
    console.log("📥 Datos recibidos en crearClase:", req.body);

    const { materia, docente, grupo, horario } = req.body;

    // Verifica si faltan datos
    if (!materia || !docente || !grupo || !horario) {
      return res.status(400).json({ error: 'Faltan datos para crear clase' });
    }

    const clase = await Clase.create({
      materia,
      docente,
      grupo,
      horario   // 👈 directamente el ObjectId
    });

    res.status(201).json(await clase.populate('materia docente horario grupo'));
  } catch (error) {
    console.error('❌ Error al crear clase:', error);
    res.status(500).json({ error: error.message });
  }
};

const actualizarClase = async (req, res) => {
  try {
    const { materia, docente, grupo, horario } = req.body;

    // Validaciones claras
    if (!materia) return res.status(400).json({ error: "Debe seleccionar una materia" });
    if (!docente) return res.status(400).json({ error: "Debe seleccionar un docente" });
    if (!grupo) return res.status(400).json({ error: "Debe seleccionar un grupo" });
    if (!horario) {
      return res.status(400).json({ error: "Debe seleccionar día y horario" });
    }

    const clase = await Clase.findByIdAndUpdate(
      req.params.id,
      { materia, docente, grupo, horario },  // 👈 actualiza la referencia
      { new: true }
    ).populate("materia docente grupo horario");

    if (!clase) return res.status(404).json({ error: "Clase no encontrada" });

    res.json(clase);

  } catch (error) {
    console.error("❌ Error al actualizar clase:", error);
    return res.status(500).json({ error: "Error al actualizar clase" });
  }
};

const eliminarClase = async (req, res) => {
  try {
    const clase = await Clase.findByIdAndDelete(req.params.id);
    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    res.status(200).json({ mensaje: 'Clase eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar clase:', error);
    res.status(500).json({ error: 'Error al eliminar clase' });
  }
};

const obtenerClasesEstudiante = async (req, res) => {
  try {
    const estudianteId = req.params.id;
    const clases = await Clase.find()
      .populate({
        path: 'grupo',
        match: { estudiantes: estudianteId }
      })
      .populate('materia')
      .populate('horario')
      .populate('"docente", "nombre apellido"');

    // Filter out clases where grupo is null (student not in grupo)
    const clasesEstudiante = clases.filter(clase => clase.grupo !== null);

    res.status(200).json(clasesEstudiante);
  } catch (error) {
    console.error('Error al obtener clases del estudiante:', error);
    res.status(500).json({ error: 'Error al obtener clases del estudiante' });
  }
};

const obtenerBloquesPorGrupo = async (req, res) => {
  try {
    const { grupoId } = req.params;
    if (!grupoId) return res.status(400).json({ error: 'Falta grupoId' });

    const clases = await Clase.find({ grupo: grupoId })
      .populate('materia')
      .populate('horario')
      .populate('docente')
      .sort({ "horario.dia": 1, "horario.horaInicio": 1 });

    res.status(200).json(clases);
  } catch (error) {
    console.error('Error obtener bloques por grupo:', error);
    res.status(500).json({ error: 'Error al obtener bloques por grupo' });
  }
};

module.exports = {
  obtenerClases,
  obtenerClasePorId,
  crearClase,
  actualizarClase,
  eliminarClase,
  obtenerClasesEstudiante,
  obtenerBloquesPorGrupo
};