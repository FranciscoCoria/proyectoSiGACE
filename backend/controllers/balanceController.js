const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const listarBalances = async (req, res) => {
  const balances = await prisma.balanceDiario.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      lineas: true
    }
  });
  res.json(balances);
};

const obtenerBalance = async (req, res) => {
  const { id } = req.params;

  const balance = await prisma.balanceDiario.findUnique({
    where: { id: parseInt(id) },
    include: {
      lineas: true
    }
  });

  if (!balance) {
    return res.status(404).json({ error: 'Balance no encontrado.' });
  }

  res.json(balance);
};

const crearBalance = async (req, res) => {
  const { fecha, tipo, cantidadAlumnos, cantidadOtrasEscuelas, lineas, menu } = req.body;
  const usuarioId = req.usuario.id;

  if (!fecha || !tipo || !lineas || lineas.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  const existente = await prisma.balanceDiario.findFirst({
    where: { fecha: new Date(fecha), tipo }
  });

  if (existente) {
    return res.status(400).json({ error: 'Ya existe un balance de ese tipo para esa fecha.' });
  }

  const cantidadComensales = (cantidadAlumnos || 0) + (cantidadOtrasEscuelas || 0);

  let total = 0;
  const lineasProcesadas = lineas.map(l => {
    const cantidadUsada = parseFloat(l.pesoPorRacion) * cantidadComensales;
    const subtotal = cantidadUsada * parseFloat(l.precioUnitario);
    total += subtotal;
    return {
      nombreIngrediente: l.nombreIngrediente,
      pesoPorRacion: parseFloat(l.pesoPorRacion),
      cantidadUsada: parseFloat(cantidadUsada.toFixed(3)),
      precioUnitario: parseFloat(l.precioUnitario),
      subtotal: parseFloat(subtotal.toFixed(2))
    };
  });

  const costoPorRacion = cantidadComensales > 0 ? total / cantidadComensales : 0;

  const balance = await prisma.balanceDiario.create({
    data: {
      fecha: new Date(fecha),
      tipo,
      cantidadComensales,
      total: parseFloat(total.toFixed(2)),
      costoPorRacion: parseFloat(costoPorRacion.toFixed(2)),
      usuarioId,
      menu: menu || null,
      lineas: {
        createMany: { data: lineasProcesadas }
      }
    },
    include: { lineas: true }
  });

  res.status(201).json(balance);
};

const modificarBalance = async (req, res) => {
  const { id } = req.params;
  const { cantidadAlumnos, cantidadOtrasEscuelas, lineas, menu } = req.body;

  const existe = await prisma.balanceDiario.findUnique({ where: { id: parseInt(id) } });
  if (!existe) {
    return res.status(404).json({ error: 'Balance no encontrado.' });
  }

  const cantidadComensales = (cantidadAlumnos || 0) + (cantidadOtrasEscuelas || 0);

  let total = 0;
  const lineasProcesadas = lineas.map(l => {
    const cantidadUsada = parseFloat(l.pesoPorRacion) * cantidadComensales;
    const subtotal = cantidadUsada * parseFloat(l.precioUnitario);
    total += subtotal;
    return {
      nombreIngrediente: l.nombreIngrediente,
      pesoPorRacion: parseFloat(l.pesoPorRacion),
      cantidadUsada: parseFloat(cantidadUsada.toFixed(3)),
      precioUnitario: parseFloat(l.precioUnitario),
      subtotal: parseFloat(subtotal.toFixed(2))
    };
  });

  const costoPorRacion = cantidadComensales > 0 ? total / cantidadComensales : 0;

  await prisma.lineaBalance.deleteMany({ where: { balanceId: parseInt(id) } });

  const balance = await prisma.balanceDiario.update({
    where: { id: parseInt(id) },
    data: {
      cantidadComensales,
      total: parseFloat(total.toFixed(2)),
      costoPorRacion: parseFloat(costoPorRacion.toFixed(2)),
      menu: menu || null,
      lineas: {
        createMany: { data: lineasProcesadas }
      }
    },
    include: { lineas: true }
  });

  res.json(balance);
};

const eliminarBalance = async (req, res) => {
  const { id } = req.params;

  const existe = await prisma.balanceDiario.findUnique({ where: { id: parseInt(id) } });
  if (!existe) {
    return res.status(404).json({ error: 'Balance no encontrado.' });
  }

  await prisma.lineaBalance.deleteMany({ where: { balanceId: parseInt(id) } });
  await prisma.balanceDiario.delete({ where: { id: parseInt(id) } });

  res.json({ mensaje: 'Balance eliminado correctamente.' });
};

module.exports = { listarBalances, obtenerBalance, crearBalance, modificarBalance, eliminarBalance };