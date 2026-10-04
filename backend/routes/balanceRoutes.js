const express = require('express');
const router = express.Router();
const { listarBalances, obtenerBalance, crearBalance, modificarBalance, eliminarBalance } = require('../controllers/balanceController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

router.use(verificarToken);
router.use(verificarRol('ECONOMA'));

router.get('/', listarBalances);
router.get('/:id', obtenerBalance);
router.post('/', crearBalance);
router.put('/:id', modificarBalance);
router.delete('/:id', eliminarBalance);

module.exports = router;