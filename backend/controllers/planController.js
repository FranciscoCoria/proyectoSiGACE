const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const listarPlanes = async (req, res) => {
  const planes = await prisma.planMensual.findMany({
    orderBy: { mes: 'desc' },
    include: {
      semanas: {
        include: { dias: true },
        orderBy: { numSemana: 'asc' }
      }
    }
  });
  res.json(planes);
};

const obtenerPlan = async (req, res) => {
  const { id } = req.params;
  const plan = await prisma.planMensual.findUnique({
    where: { id: parseInt(id) },
    include: {
      semanas: {
        include: { dias: { orderBy: { numDia: 'asc' } } },
        orderBy: { numSemana: 'asc' }
      }
    }
  });
  if (!plan) return res.status(404).json({ error: 'Plan no encontrado.' });
  res.json(plan);
};

const crearPlan = async (req, res) => {
  const { mes, semanas } = req.body;
  const usuarioId = req.usuario.id;

  if (!mes || !semanas || semanas.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  const mesDate = new Date(mes);
  console.log('Mes recibido:', mes);
  console.log('Mes parseado:', mesDate);
  const existente = await prisma.planMensual.findFirst({
    where: {
      mes: new Date(mesDate.getFullYear(), mesDate.getUTCMonth(), 1)
    }
  });
  
  if (existente) {
    return res.status(400).json({ error: 'Ya existe un plan para ese mes.' });
  }

  const plan = await prisma.planMensual.create({
    data: {
      mes: mesDate,
      estado: 'BORRADOR',
      usuarioId,
      semanas: {
        create: semanas.map(s => ({
          numSemana: s.numSemana,
          obsEconoma: s.obsEconoma || null,
          dias: {
            create: s.dias.map(d => ({
              numDia: d.numDia,
              desayuno: d.desayuno || null,
              almuerzo: d.almuerzo || null
            }))
          }
        }))
      }
    },
    include: {
      semanas: {
        include: { dias: true }
      }
    }
  });

  res.status(201).json(plan);
};

const actualizarPlan = async (req, res) => {
  const { id } = req.params;
  const { semanas, obsEconoma } = req.body;

  const plan = await prisma.planMensual.findUnique({ where: { id: parseInt(id) } });
  if (!plan) return res.status(404).json({ error: 'Plan no encontrado.' });
  if (plan.estado === 'APROBADO') return res.status(400).json({ error: 'Un plan aprobado no puede modificarse.' });

  await prisma.planDiario.deleteMany({
    where: { semana: { planId: parseInt(id) } }
  });
  await prisma.planSemanal.deleteMany({ where: { planId: parseInt(id) } });

  const planActualizado = await prisma.planMensual.update({
    where: { id: parseInt(id) },
    data: {
      semanas: {
        create: semanas.map(s => ({
          numSemana: s.numSemana,
          obsEconoma: s.obsEconoma || null,
          dias: {
            create: s.dias.map(d => ({
              numDia: d.numDia,
              desayuno: d.desayuno || null,
              almuerzo: d.almuerzo || null
            }))
          }
        }))
      }
    },
    include: {
      semanas: {
        include: { dias: true }
      }
    }
  });

  res.json(planActualizado);
};

const enviarPlan = async (req, res) => {
  const { id } = req.params;

  const plan = await prisma.planMensual.findUnique({
    where: { id: parseInt(id) },
    include: {
      semanas: { include: { dias: true } }
    }
  });

  if (!plan) return res.status(404).json({ error: 'Plan no encontrado.' });
  if (plan.estado === 'APROBADO') return res.status(400).json({ error: 'El plan ya está aprobado.' });

  const incompleto = plan.semanas.some(s =>
    s.dias.some(d => !d.desayuno || !d.almuerzo)
  );

  if (incompleto) {
    return res.status(400).json({ error: 'Todos los días deben tener desayuno y almuerzo completos.' });
  }

  const planActualizado = await prisma.planMensual.update({
    where: { id: parseInt(id) },
    data: { estado: 'ENVIADO' }
  });

  res.json(planActualizado);
};

const aprobarPlan = async (req, res) => {
  const { id } = req.params;

  const plan = await prisma.planMensual.findUnique({ where: { id: parseInt(id) } });
  if (!plan) return res.status(404).json({ error: 'Plan no encontrado.' });
  if (plan.estado === 'APROBADO') return res.status(400).json({ error: 'El plan ya está aprobado.' });

  const planActualizado = await prisma.planMensual.update({
    where: { id: parseInt(id) },
    data: { estado: 'APROBADO', obsDirectora: null }
  });

  res.json(planActualizado);
};

const registrarObservacion = async (req, res) => {
  const { id } = req.params;
  const { obsDirectora } = req.body;

  if (!obsDirectora) return res.status(400).json({ error: 'La observación no puede estar vacía.' });

  const plan = await prisma.planMensual.findUnique({ where: { id: parseInt(id) } });
  if (!plan) return res.status(404).json({ error: 'Plan no encontrado.' });

  const planActualizado = await prisma.planMensual.update({
    where: { id: parseInt(id) },
    data: { estado: 'CON_OBSERVACIONES', obsDirectora }
  });

  res.json(planActualizado);
};

const eliminarPlan = async (req, res) => {
  const { id } = req.params;

  const plan = await prisma.planMensual.findUnique({ where: { id: parseInt(id) } });
  if (!plan) return res.status(404).json({ error: 'Plan no encontrado.' });
  if (plan.estado === 'APROBADO') return res.status(400).json({ error: 'Un plan aprobado no puede eliminarse.' });

  await prisma.planDiario.deleteMany({
    where: { semana: { planId: parseInt(id) } }
  });
  await prisma.planSemanal.deleteMany({ where: { planId: parseInt(id) } });
  await prisma.planMensual.delete({ where: { id: parseInt(id) } });

  res.json({ mensaje: 'Plan eliminado correctamente.' });
};

module.exports = { listarPlanes, obtenerPlan, crearPlan, actualizarPlan, enviarPlan, aprobarPlan, registrarObservacion, eliminarPlan };