//Acá se aplican los dos middlewares a todas las rutas del módulo con router.use().
// Eso significa que cualquier petición a /api/usuarios primero pasa por verificarToken
// y después por verificarRol('DIRECTORA'). Si alguno falla, la petición no llega al controller.

const express = require('express');
const router = express.Router();
const { listarUsuarios, crearUsuario, modificarUsuario, eliminarUsuario } = require('../controllers/usuarioController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

router.use(verificarToken);
router.use(verificarRol('DIRECTORA'));

router.get('/', listarUsuarios);
router.post('/', crearUsuario);
router.put('/:id', modificarUsuario);
router.delete('/:id', eliminarUsuario);

module.exports = router;