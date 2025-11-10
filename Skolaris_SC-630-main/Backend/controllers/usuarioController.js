const modeloUsuario = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');

// Crear usuario con hashing de contraseña
const crearUsuario = async (req, res) => {
  try {
    const datos = req.body;

    // Validar que haya contraseña en el body
    if (!datos.contrasena) {
      return res.status(400).json({ error: "La contraseña es obligatoria" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(datos.contrasena, 10);
    
    const nuevoUsuario = new modeloUsuario({
        ...datos, 
        contrasena: hashedPassword 
    });

    await nuevoUsuario.save();

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    // Manejo de error por clave duplicada (email único)
    if (error.code === 11000) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    res.status(500).json({ error: "Error al crear usuario" });
  }
};

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const filtro = {};

    if (req.query.rol) {
      filtro.rol = req.query.rol; // Esto aplica el filtro cuando haces /usuarios?rol=Docente
    }

    const usuarios = await modeloUsuario.find(filtro).select('-contrasena');
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

// Actualizar usuario basado en el id del token (req.user)
const actualizarUsuarios = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId) {
      return res.status(400).json({ error: "ID de usuario no encontrado" });
    }

    const usuarioActualizado = await modeloUsuario.findByIdAndUpdate(
      userId,
      req.body,
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json(usuarioActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar los datos" });
  }
};

// =====> NUEVO: Actualizar roles de usuario (ahora soporta múltiples roles)
const actualizarRolesUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.id;
    let { rol } = req.body;

    // Si llega como string JSON, parsearlo
    if (typeof rol === 'string') {
      try {
        rol = JSON.parse(rol);
      } catch {
        return res.status(400).json({ error: 'Formato de roles inválido' });
      }
    }

    if (!Array.isArray(rol) || rol.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un rol' });
    }

    // Validar roles contra el enum
    const rolesValidos = ['Admin', 'Docente', 'Estudiante', 'Tutor'];
    const rolesInvalidos = rol.filter(r => !rolesValidos.includes(r));
    if (rolesInvalidos.length > 0) {
      return res.status(400).json({ error: `Roles inválidos: ${rolesInvalidos.join(', ')}` });
    }

    const usuario = await modeloUsuario.findByIdAndUpdate(
      usuarioId,
      { rol },
      { new: true }
    );

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    return res.json({
      message: 'Roles actualizados correctamente',
      usuario
    });

  } catch (error) {
    console.error('Error actualizando roles:', error);
    return res.status(500).json({ error: 'Error al actualizar roles' });
  }
};


// Eliminar usuario
const eliminarUsuarios = async (req, res) => {
  try {
    // Usamos findByIdAndUpdate para cambiar 'activo' a false
    const usuarioDesactivado = await modeloUsuario.findByIdAndUpdate(
        req.params.id, 
        { activo: false }, 
        { new: true } 
    );
    
    // Si el usuarioDesactivado es null, significa que el ID no se encontró
    if (!usuarioDesactivado) {
        //Devuelve un 404 JSON
        return res.status(404).json({ message: "Usuario no encontrado para desactivar." });
    }
    
    res.status(200).json({ message: "Usuario desactivado correctamente." });
  } catch (error) {
    // Si hay un error de conexión o formato de ID
    res.status(500).json({ message: "Error interno al desactivar el usuario.", error: error.message });
  }
};


// NUEVO: Función para REACTIVAR usuario
const reactivarUsuario = async (req, res) => {
    try {
        const userId = req.params.id;
        //Cambiar 'activo' a true
        const usuarioActivado = await modeloUsuario.findByIdAndUpdate(
            userId,
            { activo: true },
            { new: true }
        );

        if (!usuarioActivado) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.status(200).json({ message: "Usuario activado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al reactivar el usuario" });
    }
};


// =====> NUEVO: Obtener datos del usuario autenticado
const Usuario = require('../models/usuarioModel');

const obtenerUsuarioActual = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(400).json({ error: 'No se pudo determinar el ID del usuario desde el token' });
    }

    const usuario = await Usuario.findById(userId)
      .populate({
        path: 'grupo', // <-- Poblar el grupo correctamente
        select: 'nombre grado seccion turno' // puedes ajustar los campos
      })
      .select('-contrasena'); 

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    res.status(500).json({ error: 'Error al obtener usuario actual' });
  }
};


// Función para agregar un grupo al estudiante
const asignarGrupoAUsuario = async (req, res) => {
  try {
    const usuarioCedula = req.params.id;
    console.log('➡️ Cédula recibida:', req.params.id);

    const { grupoId } = req.body;
    console.log('➡️ Grupo ID recibido:', req.body.grupoId);
    // Buscar usuario por cédula
    const usuario = await modeloUsuario.findOne({ cedula: usuarioCedula });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado con esa cédula' });

    if (!usuario.rol.includes('Estudiante')) {
      return res.status(400).json({ error: 'Solo se pueden asignar grupos a estudiantes' });
    }

    usuario.grupo = grupoId;
    await usuario.save();

    res.status(200).json({ message: 'Grupo asignado correctamente', usuario });
  } catch (error) {
    console.error('[ERROR] al asignar grupo:', error);
    res.status(500).json({ error: 'Error al asignar grupo al estudiante' });
  }
};

const obtenerEstudiantes = async (req, res) => {
  try {
    const estudiantes = await modeloUsuario.find({ rol: 'Estudiante' }).populate('grupo');
    res.json(estudiantes);
  } catch (error) {
    console.error("❌ Error en obtenerEstudiantes:", error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
};


// ===== BUSCAR ESTUDIANTE POR CÉDULA =====
const buscarEstudiantePorCedula = async (req, res) => {
  try {
    const cedulaParam = req.params.cedula?.trim();
    if (!cedulaParam) return res.status(400).json({ error: 'Debe proporcionar una cédula' });

    // Buscar usuario convirtiendo cedula de la DB a string
    const usuario = await modeloUsuario.findOne({
      $expr: { $eq: [{ $toString: "$cedula" }, cedulaParam] }
    });

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (!usuario.rol.includes('Estudiante')) {
      return res.status(403).json({ error: 'Solo se pueden agregar estudiantes' });
    }

    res.status(200).json(usuario);

  } catch (error) {
    console.error('[ERROR] buscarEstudiantePorCedula:', error);
    res.status(500).json({ error: 'Error al buscar estudiante por cédula' });
  }
};



module.exports = {
  crearUsuario,
  obtenerUsuarios,
  actualizarUsuarios,
  actualizarRolesUsuario,
  eliminarUsuarios,
  reactivarUsuario,
  obtenerUsuarioActual,
  asignarGrupoAUsuario,
  obtenerEstudiantes,
  buscarEstudiantePorCedula
};