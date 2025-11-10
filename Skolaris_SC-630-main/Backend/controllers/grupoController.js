const Grupo = require('../models/grupoModel');
const Usuario = require('../models/usuarioModel');

// =====================================================
// 🟢 Crear nuevo grupo
// =====================================================
const crearGrupo = async (req, res) => {
  try {
    const grupo = new Grupo(req.body);
    await grupo.save();
    res.status(201).json(grupo);
  } catch (error) {
    console.error('❌ Error al crear grupo:', error);
    res.status(500).json({ error: 'Error interno al crear grupo' });
  }
};

// =====================================================
// 🟢 Obtener todos los grupos (con grado asociado)
// =====================================================
const obtenerGrupos = async (req, res) => {
  try {
    const grupos = await Grupo.find().populate('grado');
    res.status(200).json(grupos);
  } catch (error) {
    console.error('❌ Error al obtener grupos:', error);
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
};

// =====================================================
// 🟢 Obtener estudiantes de un grupo específico
// =====================================================
const obtenerEstudiantesDeGrupo = async (req, res) => {
  try {
    const grupoId = req.params.id;

    // Busca los usuarios que pertenezcan a este grupo y sean Estudiantes
    const estudiantes = await Usuario.find({
      grupo: grupoId,
      rol: { $in: ['Estudiante'] } // 🔥 Importante: tu campo "rol" es un array
    }).select('-contrasena'); // No devolver la contraseña

    res.status(200).json(estudiantes);
  } catch (error) {
    console.error('❌ [ERROR obtenerEstudiantesDeGrupo]', error);
    res.status(500).json({ message: 'Error al obtener estudiantes del grupo.' });
  }
};

// =====================================================
// 🟢 Actualizar grupo por ID
// =====================================================
const actualizarGrupo = async (req, res) => {
  try {
    const grupoActualizado = await Grupo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!grupoActualizado) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    res.status(200).json(grupoActualizado);
  } catch (error) {
    console.error('❌ Error al actualizar grupo:', error);
    res.status(500).json({ error: 'Error al actualizar grupo' });
  }
};

// =====================================================
// 🟢 Eliminar grupo por ID
// =====================================================
const eliminarGrupo = async (req, res) => {
  try {
    await Grupo.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Grupo eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar grupo:', error);
    res.status(500).json({ error: 'Error al eliminar grupo' });
  }
};

const obtenerEstudiantesPorGrupo = async (req, res) => {
  try {
    const { grupoId } = req.params;
    const grupo = await Grupo.findById(grupoId)
      .populate('estudiantes', 'nombre apellido cedula email');

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    res.status(200).json(grupo.estudiantes);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes del grupo' });
  }
};

const agregarEstudianteAGrupo = async (req, res) => {
  try {
    const { grupoId } = req.params;
    const { estudianteId } = req.body;

    // 1. Buscar grupo
    const grupo = await Grupo.findById(grupoId);
    if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });

    // 2. Evitar duplicados en el grupo
    if (grupo.estudiantes.includes(estudianteId)) {
      return res.status(400).json({ error: 'El estudiante ya está en este grupo' });
    }

    // 3. Agregar el estudiante al grupo
    grupo.estudiantes.push(estudianteId);
    await grupo.save();

    // 4. ACTUALIZAR el usuario → asignarle este grupo
    await Usuario.findByIdAndUpdate(estudianteId, { grupo: grupoId });

    return res.status(200).json({ mensaje: '✅ Estudiante asignado al grupo correctamente' });
  } catch (error) {
    console.error('❌ Error al agregar estudiante:', error);
    res.status(500).json({ error: 'Error al agregar estudiante al grupo' });
  }
};


const eliminarEstudianteDeGrupo = async (req, res) => {
  try {
    const { estudianteId } = req.params;

    // 1. Encuentra el grupo donde está
    const grupo = await Grupo.findOne({ estudiantes: estudianteId });
    if (!grupo) {
      return res.status(404).json({ error: 'Estudiante no encontrado en ningún grupo' });
    }

    // 2. Quitar del array
    grupo.estudiantes = grupo.estudiantes.filter(id => id.toString() !== estudianteId);
    await grupo.save();

    // 3. Quitar referencia del usuario
    await Usuario.findByIdAndUpdate(estudianteId, { $unset: { grupo: "" } });

    res.status(200).json({ mensaje: '✅ Estudiante eliminado del grupo' });

  } catch (error) {
    console.error('❌ Error al eliminar estudiante del grupo:', error);
    res.status(500).json({ error: 'Error al eliminar estudiante del grupo' });
  }
};


// =====================================================
// 🟢 Exportar controladores
// =====================================================
module.exports = {
  crearGrupo,
  obtenerGrupos,
  obtenerEstudiantesDeGrupo,
  obtenerEstudiantesPorGrupo,
  agregarEstudianteAGrupo,
  eliminarEstudianteDeGrupo,
  actualizarGrupo,
  eliminarGrupo,
};
