const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const authMiddleware = require('../middlewares/authMiddleware');

//Middleware para Docentes o Admins
const docenteAdminMiddleware = authMiddleware(['Docente', 'Admin']);

//Ruta para guardar o modificar asistencia
router.post('/', docenteAdminMiddleware, asistenciaController.guardarAsistencia);

//Ruta para obtener los registros de una fecha específica
router.get('/registros', docenteAdminMiddleware, asistenciaController.obtenerAsistenciaPorFecha);

//Ruta para obtener todas las fechas de una clase
router.get('/fechas/:claseId', docenteAdminMiddleware, asistenciaController.obtenerFechasDeClase);

module.exports = router;