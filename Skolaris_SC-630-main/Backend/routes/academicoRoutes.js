const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Router académico funcionando' });
});

// Importar controladores de forma segura
const horarioCtrl = require('../controllers/horarioController');
const claseCtrl = require('../controllers/claseController');
const materiaCtrl = require('../controllers/materiaController');
const grupoCtrl = require('../controllers/grupoController');

// Verificar que los controladores existan antes de crear las rutas
if (horarioCtrl) {
    // Horarios CRUD
    router.get('/horarios', auth(['Admin', 'Docente']), horarioCtrl.obtenerHorarios);
    router.post('/horarios', auth(['Admin']), horarioCtrl.crearHorario);
    router.get('/horarios/:id', auth(['Admin', 'Docente']), horarioCtrl.obtenerHorarioPorId);
    router.put('/horarios/:id', auth(['Admin']), horarioCtrl.actualizarHorario);
    router.delete('/horarios/:id', auth(['Admin']), horarioCtrl.eliminarHorario);

    // Bloques por grupo
    router.get('/horarios/bloques/:grupoId', auth(['Admin', 'Estudiante']), horarioCtrl.obtenerBloquesPorGrupo);
}

if (grupoCtrl) {
    // Rutas de grupos y estudiantes
    router.get('/grupos', auth(['Admin', 'Docente']), grupoCtrl.obtenerGrupos);
    router.post('/grupos', auth(['Admin']), grupoCtrl.crearGrupo);
    router.get('/grupos/:grupoId/estudiantes', auth(['Admin', 'Docente']), grupoCtrl.obtenerEstudiantesPorGrupo);
    router.post('/grupos/:grupoId/estudiantes', auth(['Admin']), grupoCtrl.agregarEstudianteAGrupo);
    router.delete('/grupos/estudiantes/:estudianteId', auth(['Admin']), grupoCtrl.eliminarEstudianteDeGrupo);
}

if (materiaCtrl) {
    // Materias CRUD
    router.get('/materias', auth(['Admin', 'Docente']), materiaCtrl.obtenerMaterias);
    router.post('/materias', auth(['Admin']), materiaCtrl.crearMateria);
    router.get('/materias/:id', auth(['Admin', 'Docente']), materiaCtrl.obtenerMateriaPorId);
}

if (claseCtrl) {
    // Clases CRUD
    router.get('/clases', auth(['Admin', 'Docente']), claseCtrl.obtenerClases);
    router.get('/clases/:id', auth(['Admin', 'Docente']), claseCtrl.obtenerClasePorId);
    router.post('/clases', auth(['Admin']), claseCtrl.crearClase);
    router.put('/clases/:id', auth(['Admin']), claseCtrl.actualizarClase);
    router.delete('/clases/:id', auth(['Admin']), claseCtrl.eliminarClase);
    // Bloques por grupo
    router.get('/clases/bloques/:grupoId', auth(['Admin', 'Estudiante']), claseCtrl.obtenerBloquesPorGrupo);
}

module.exports = router;