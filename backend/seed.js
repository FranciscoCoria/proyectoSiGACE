const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHasheada = await bcrypt.hash('admin123', 10);
  
  const directora = await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      apellido: 'Sistema',
      usuario: 'directora',
      password: passwordHasheada,
      rol: 'DIRECTORA'
    }
  });
  
  console.log('Usuario creado:', directora);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());