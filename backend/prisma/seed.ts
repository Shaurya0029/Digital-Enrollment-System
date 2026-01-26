import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Running TypeScript seed...');

  const policies = [
    { policyNumber: 'POL-1001', name: 'Basic Health' },
    { policyNumber: 'POL-2001', name: 'Premium Health' },
  ];

  for (const p of policies) {
    const exists = await prisma.policy.findUnique({ where: { policyNumber: p.policyNumber } });
    if (!exists) {
      await prisma.policy.create({ data: p });
      console.log('Created policy', p.policyNumber);
    }
  }

  const hrEmail = 'hr@example.com';
  const existingHr = await prisma.user.findUnique({ where: { email: hrEmail } });
  if (!existingHr) {
    const hr = await prisma.user.create({
      data: {
        name: 'HR Manager',
        email: hrEmail,
        password: await bcrypt.hash('password123', 10),
        role: 'HR',
      },
    });
    console.log('Created HR user:', hr.email);
  } else {
    console.log('HR user already exists:', hrEmail);
  }

  const empEmail = 'employee@example.com';
  const existingEmp = await prisma.user.findUnique({ where: { email: empEmail } });
  if (!existingEmp) {
    const emp = await prisma.user.create({
      data: {
        name: 'Sample Employee',
        email: empEmail,
        password: await bcrypt.hash('password123', 10),
        role: 'EMPLOYEE',
      },
    });
    console.log('Created Employee user:', emp.email);
    await prisma.employee.create({ data: { userId: emp.id } });
    console.log('Created Employee record for user:', emp.email);
  } else {
    console.log('Employee user already exists:', empEmail);
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
