const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

(async () => {
  try {
    // Get the employee user
    const user = await prisma.user.findUnique({
      where: { email: 'employee@example.com' }
    });
    
    if (!user) {
      console.log('❌ Employee not found');
      return;
    }
    
    console.log('Employee user found:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Password hash: ${user.password.substring(0, 30)}...`);
    
    // Test the password
    const isValid = await bcrypt.compare('password', user.password);
    console.log(`\n✅ Password 'password' is ${isValid ? 'VALID' : 'INVALID'}`);
    
  } finally {
    await prisma.$disconnect();
  }
})();
