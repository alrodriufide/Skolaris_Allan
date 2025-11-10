const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const {
  crearGrado,
  obtenerGrados,
  actualizarGrado,
  eliminarGrado,
} = require('../controllers/gradoController');

router.post('/', authMiddleware('Admin'), crearGrado);
router.get('/', authMiddleware(['Admin', 'Docente']), obtenerGrados);
router.put('/:id', authMiddleware('Admin'), actualizarGrado);
router.delete('/:id', authMiddleware('Admin'), eliminarGrado);


module.exports = router;
