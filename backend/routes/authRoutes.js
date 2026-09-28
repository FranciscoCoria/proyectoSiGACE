//define que cuando llegue una petición POST a /login, se ejecute la función login del controller.
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

router.post('/login', login);

module.exports = router;