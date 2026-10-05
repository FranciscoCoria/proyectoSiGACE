const express = require('express');
const router = express.Router();
const { listarPlanes, obtenerPlan, crearPlan, actualizarPlan, enviarPlan, aprobarPlan, registrarObservacion, eliminarPlan } = require('../controllers/planController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

router.use(verificarToken);

router.get('/', (req, res, next) => {
  verificarRol('ECONOMA', 'DIRECTORA')(req, res, next);
}, listarPlanes);

router.get('/:id', (req, res, next) => {
  verificarRol('ECONOMA', 'DIRECTORA')(req, res, next);
}, obtenerPlan);

router.post('/', verificarRol('ECONOMA'), crearPlan);
router.put('/:id', verificarRol('ECONOMA'), actualizarPlan);
router.post('/:id/enviar', verificarRol('ECONOMA'), enviarPlan);
router.post('/:id/aprobar', verificarRol('DIRECTORA'), aprobarPlan);
router.post('/:id/observacion', verificarRol('DIRECTORA'), registrarObservacion);
router.delete('/:id', verificarRol('ECONOMA'), eliminarPlan);

module.exports = router;