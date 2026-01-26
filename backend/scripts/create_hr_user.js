const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Creating HR user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create HR user
    const user = await prisma.user.create({
      data: {
        name: 'Admin HR',
        email: 'hr@example.com',
        password: hashedPassword,
        role: 'HR'
      }
    });
    
    console.log('✅ HR user created:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${user.role}`);
  } catch (err) {
    if (err.code === 'P2002') {
      console.log('⚠️  HR user already exists');
    } else {
      console.error('❌ Error:', err.message);
    }
  } finally {
    await prisma.$disconnect();
  }
})();
