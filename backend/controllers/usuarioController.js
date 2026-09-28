const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const listarUsuarios = async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      apellido: true,
      usuario: true,
      rol: true
    }
  });
  res.json(usuarios);
};
//listarUsuarios: busca todos los usuarios en la base de datos con findMany y los devuelve. 
//Usa select para no devolver la contraseña, aunque esté hasheada no tiene sentido enviarla.

const crearUsuario = async (req, res) => {
  const { nombre, apellido, usuario, password, rol } = req.body;

  if (!nombre || !apellido || !usuario || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  const existe = await prisma.usuario.findUnique({ where: { usuario } });
  if (existe) {
    return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
  }

  const passwordHasheada = await bcrypt.hash(password, 10);

  const nuevoUsuario = await prisma.usuario.create({
    data: { nombre, apellido, usuario, password: passwordHasheada, rol }
  });

  res.status(201).json({
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    apellido: nuevoUsuario.apellido,
    usuario: nuevoUsuario.usuario,
    rol: nuevoUsuario.rol
  });
};
//crearUsuario recibe los datos del formulario, valida que estén completos, verifica que el nombre de usuario no esté duplicado, 
// hashea la contraseña y crea el registro. Devuelve el usuario creado sin la contraseña.


const modificarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, usuario, password, rol } = req.body;

  const existe = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
  if (!existe) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const data = { nombre, apellido, usuario, rol };

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const actualizado = await prisma.usuario.update({
    where: { id: parseInt(id) },
    data,
    select: { id: true, nombre: true, apellido: true, usuario: true, rol: true }
  });

  res.json(actualizado);
};
//modificarUsuario recibe el id por la URL (/api/usuarios/1) y los datos nuevos por el body. 
//Si viene una contraseña nueva la hashea, si no viene no la toca. Actualiza solo los campos recibidos.

const eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  const existe = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
  if (!existe) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  await prisma.usuario.delete({ where: { id: parseInt(id) } });
  res.json({ mensaje: 'Usuario eliminado correctamente.' });
};
//recibe el id por la URL, verifica que exista y lo elimina.


module.exports = { listarUsuarios, crearUsuario, modificarUsuario, eliminarUsuario };