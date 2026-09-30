const express = require('express');
const router = express.Router();
const { listarAlumnos, crearAlumno, modificarAlumno, eliminarAlumno } = require('../controllers/alumnoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

router.use(verificarToken);
router.use(verificarRol('CELADORA', 'ECONOMA'));

router.get('/', listarAlumnos);
router.post('/', crearAlumno);
router.put('/:id', modificarAlumno);
router.delete('/:id', eliminarAlumno);

module.exports = router;