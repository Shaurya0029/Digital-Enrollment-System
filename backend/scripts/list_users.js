const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany();
    console.log('Total users:', users.length);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [${u.role}]`);
    });
  } finally {
    await prisma.$disconnect();
  }
})();
