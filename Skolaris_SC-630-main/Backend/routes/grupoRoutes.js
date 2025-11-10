const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  crearGrupo,
  obtenerGrupos,
  obtenerEstudiantesDeGrupo, // ✅ Importamos también esto
  actualizarGrupo,
  eliminarGrupo,
} = require('../controllers/grupoController');

// Crear grupo
router.post('/', authMiddleware('Admin'), crearGrupo);

// Obtener todos los grupos
router.get('/', authMiddleware(['Admin', 'Docente']), obtenerGrupos);

// ✅ Obtener estudiantes de un grupo (más limpio)
router.get('/:id/estudiantes', authMiddleware(['Admin', 'Docente']), obtenerEstudiantesDeGrupo);

// Actualizar grupo
router.put('/:id', authMiddleware('Admin'), actualizarGrupo);

// Eliminar grupo
router.delete('/:id', authMiddleware('Admin'), eliminarGrupo);

module.exports = router;
