const express = require('express');
const router = express.Router();
const { obtenerAsistencia, registrarAsistencia } = require('../controllers/asistenciaController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

router.use(verificarToken);
router.use(verificarRol('CELADORA'));

router.get('/:fecha', obtenerAsistencia);
router.post('/', registrarAsistencia);

module.exports = router;