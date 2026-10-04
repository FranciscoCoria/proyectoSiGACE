const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerAsistencia = async (req, res) => {
  const { fecha } = req.params;

  const asistencia = await prisma.asistencia.findFirst({
    where: { fecha: new Date(fecha) },
    include: {
      registros: {
        include: { alumno: true },
        orderBy: { alumno: { apellido: 'asc' } }
      }
    }
  });

  if (!asistencia) {
    const alumnos = await prisma.alumno.findMany({
      orderBy: { apellido: 'asc' }
    });
    return res.json({ existe: false, alumnos });
  }

  const todosLosAlumnos = await prisma.alumno.findMany({
    orderBy: { apellido: 'asc' }
  });

  const alumnosConRegistro = asistencia.registros.map(r => r.alumnoId);
  const alumnosSinRegistro = todosLosAlumnos.filter(a => !alumnosConRegistro.includes(a.id));

  res.json({ 
    existe: true, 
    asistencia,
    alumnosSinRegistro
  });
};
const registrarAsistencia = async (req, res) => {
  const { fecha, registros } = req.body;
  const usuarioId = req.usuario.id;

  if (!fecha || !registros || !Array.isArray(registros)) {
    return res.status(400).json({ error: 'Datos inválidos.' });
  }

  const fechaDate = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaDate > hoy) {
    return res.status(400).json({ error: 'No se puede registrar asistencia para fechas futuras.' });
  }

  const existente = await prisma.asistencia.findFirst({
    where: { fecha: fechaDate }
  });

  if (existente) {
    await prisma.registroAsistencia.deleteMany({
      where: { asistenciaId: existente.id }
    });

    await prisma.registroAsistencia.createMany({
      data: registros.map(r => ({
        asistenciaId: existente.id,
        alumnoId: r.alumnoId,
        presente: r.presente
      }))
    });

    return res.json({ mensaje: 'Asistencia actualizada correctamente.' });
  }

  const asistencia = await prisma.asistencia.create({
    data: {
      fecha: fechaDate,
      usuarioId,
      registros: {
        createMany: {
          data: registros.map(r => ({
            alumnoId: r.alumnoId,
            presente: r.presente
          }))
        }
      }
    }
  });

  res.status(201).json({ mensaje: 'Asistencia registrada correctamente.', id: asistencia.id });
};

module.exports = { obtenerAsistencia, registrarAsistencia };