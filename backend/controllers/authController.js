//El authController.js va a verificar si un usuario y contraseña son válidos y si lo son, devolver un token.

//Importa las tres herramientas que necesita:
const { PrismaClient } = require('@prisma/client'); //Prisma para hablar con la base de datos
const bcrypt = require('bcrypt');                   //bcrypt para comparar contraseñas
const jwt = require('jsonwebtoken');                //jwt para generar el token

const prisma = new PrismaClient();
const SECRET = 'sigace_secret_key';

const login = async (req, res) => {
  const { usuario, password } = req.body;

  // Verificar que los campos no estén vacíos
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  // Buscar el usuario en la base de datos
  const usuarioEncontrado = await prisma.usuario.findUnique({
    where: { usuario }
  });

  // Si no existe el usuario
  if (!usuarioEncontrado) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Comparar la contraseña con el hash
  const passwordValida = await bcrypt.compare(password, usuarioEncontrado.password);

  if (!passwordValida) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Generar el token
  const token = jwt.sign(
    { 
      id: usuarioEncontrado.id, 
      rol: usuarioEncontrado.rol 
    },
    SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    usuario: {
      id: usuarioEncontrado.id,
      nombre: usuarioEncontrado.nombre,
      apellido: usuarioEncontrado.apellido,
      rol: usuarioEncontrado.rol
    }
  });
};

module.exports = { login };