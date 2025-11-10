const express = require('express');
const router = express.Router();
const horarioCtrl = require('../controllers/horarioController');

// Crear horario
router.post('/', horarioCtrl.crearHorario);

// Obtener todos los horarios
router.get('/', horarioCtrl.obtenerHorarios);

// Obtener horario por ID
router.get('/:id', horarioCtrl.obtenerHorarioPorId);

// Actualizar horario
router.put('/:id', horarioCtrl.actualizarHorario);

// Eliminar horario
router.delete('/:id', horarioCtrl.eliminarHorario);

module.exports = router;