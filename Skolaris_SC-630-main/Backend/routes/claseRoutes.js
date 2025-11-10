const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const claseCtrl = require('../controllers/claseController');

console.log('Available controller methods:', Object.keys(claseCtrl));

// Crear clase (solo Admin)
router.post('/', auth('Admin'), claseCtrl.crearClase);

// Obtener todas las clases (Admin, Docente y Estudiante)
router.get('/', auth(['Admin', 'Docente', 'Estudiante']), claseCtrl.obtenerClases);

// Obtener clase por ID (Admin y Docente)
router.get('/:id', auth(['Admin', 'Docente']), claseCtrl.obtenerClasePorId);

// Actualizar clase (solo Admin)
router.put('/:id', auth('Admin'), claseCtrl.actualizarClase);

// Eliminar clase (solo Admin)
router.delete('/:id', auth('Admin'), claseCtrl.eliminarClase);

// Obtener clases de un estudiante
router.get('/estudiante/:id', claseCtrl.obtenerClasesEstudiante);

// Obtener clases por bloques según grupo
router.get('/bloques/:grupoId', claseCtrl.obtenerBloquesPorGrupo);

module.exports = router;
