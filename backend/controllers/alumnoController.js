const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const listarAlumnos = async (req, res) => {     //busca todos los alumnos en la tabla Alumno ordenados por apellido y los devuelve como JSON.
  const alumnos = await prisma.alumno.findMany({
    orderBy: { apellido: 'asc' }
  });
  res.json(alumnos);
};

const crearAlumno = async (req, res) => {
  const { nombre, apellido, dieta } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ error: 'Nombre y apellido son obligatorios.' });
  }

  const alumno = await prisma.alumno.create({
    data: { nombre, apellido, dieta: dieta || null }
  });

  res.status(201).json(alumno);
};

const modificarAlumno = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, dieta } = req.body;

  const existe = await prisma.alumno.findUnique({ where: { id: parseInt(id) } });
  if (!existe) {
    return res.status(404).json({ error: 'Alumno no encontrado.' });
  }

  const alumno = await prisma.alumno.update({
    where: { id: parseInt(id) },
    data: { nombre, apellido, dieta: dieta || null }
  });

  res.json(alumno);
};

const eliminarAlumno = async (req, res) => {
  const { id } = req.params;

  const existe = await prisma.alumno.findUnique({ where: { id: parseInt(id) } });
  if (!existe) {
    return res.status(404).json({ error: 'Alumno no encontrado.' });
  }

  await prisma.alumno.delete({ where: { id: parseInt(id) } });
  res.json({ mensaje: 'Alumno eliminado correctamente.' });
};

module.exports = { listarAlumnos, crearAlumno, modificarAlumno, eliminarAlumno };