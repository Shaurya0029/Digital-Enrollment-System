import { prisma } from './src/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function testEmployeeCreation() {
  try {
    // 1. Create an HR user if it doesn't exist
    let hrUser = await prisma.user.findUnique({ where: { email: 'hr@test.com' } });
    if (!hrUser) {
      hrUser = await prisma.user.create({
        data: {
          name: 'HR Admin',
          email: 'hr@test.com',
          password: await bcrypt.hash('password123', 8),
          role: 'HR',
        },
      });
      console.log('✓ Created HR user:', hrUser.email);
    } else {
      console.log('✓ HR user already exists:', hrUser.email);
    }

    // 2. Generate JWT token for HR user
    const token = jwt.sign({ userId: hrUser.id, role: hrUser.role }, JWT_SECRET, { expiresIn: '8h' });
    console.log('✓ Generated JWT token');

    // 3. Test creating an employee via API
    const testEmployee = {
      name: 'Test Employee',
      email: `test_emp_${Date.now()}@test.com`,
      password: 'password123',
    };

    const response = await fetch('http://localhost:5000/hr/employee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(testEmployee),
    });

    const result = await response.json();
    console.log('\n=== API Response ===');
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('\n❌ Failed to create employee');
      process.exit(1);
    }

    // 4. Verify employee was created in database
    const createdEmployee = await prisma.employee.findFirst({
      where: { user: { email: testEmployee.email } },
      include: { user: true },
    });

    if (createdEmployee) {
      console.log('\n✓ Employee successfully created in database');
      console.log('  ID:', createdEmployee.id);
      console.log('  Name:', createdEmployee.user.name);
      console.log('  Email:', createdEmployee.user.email);
    } else {
      console.log('\n❌ Employee not found in database after creation');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEmployeeCreation();
