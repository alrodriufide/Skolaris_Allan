const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const Usuario = require('../models/usuarioModel');

const {
  crearUsuario,
  actualizarUsuarios,
  actualizarRolesUsuario, 
  eliminarUsuarios,
  reactivarUsuario,
  obtenerUsuarioActual,
  asignarGrupoAUsuario,
  obtenerEstudiantes,
  buscarEstudiantePorCedula
} = require('../controllers/usuarioController');

// ===== CREAR USUARIO =====
router.post('/', crearUsuario);

// ===== OBTENER TODOS LOS USUARIOS O FILTRAR POR ROL =====
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const rol = req.query.rol;
    const filtro = rol ? { rol } : {};
    const usuarios = await Usuario.find(filtro);
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// ===== OBTENER USUARIO AUTENTICADO =====
router.get('/me', authMiddleware(), obtenerUsuarioActual);

// ===== ACTUALIZAR USUARIO AUTENTICADO =====
router.put('/update', authMiddleware(), actualizarUsuarios);

// ===== ACTUALIZAR USUARIO POR ID (Solo Admin) =====
router.put('/:id', authMiddleware(['Admin']), actualizarUsuarios);

// ===== ACTUALIZAR ROL DE USUARIO (Solo Admin) =====
router.put('/:id/rol', authMiddleware(['Admin']), actualizarRolesUsuario);

// Eliminar usuario
router.put('/:id/desactivar', authMiddleware('Admin'), eliminarUsuarios);

// NUEVO: Reactivar usuario
router.put('/:id/activar', authMiddleware('Admin'), reactivarUsuario); // <-- RUTA DE REACTIVACIÓN

// ===== ASIGNAR GRUPO A ESTUDIANTE (Solo Admin) =====
router.put('/:id/asignar-grupo', authMiddleware(['Admin']), asignarGrupoAUsuario);

// ===== OBTENER TODOS LOS ESTUDIANTES (Solo Admin) =====
router.get('/estudiantes', authMiddleware(['Admin']), obtenerEstudiantes);

// ===== BUSCAR ESTUDIANTE POR CÉDULA (Admin o Docente) =====
router.get('/cedula/:cedula', authMiddleware(['Admin', 'Docente']), buscarEstudiantePorCedula);

module.exports = router;