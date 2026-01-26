const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedTestEmployee() {
  try {
    console.log("Creating test employee...");

    // Hash password
    const hashedPassword = await bcrypt.hash("password", 10);

    // Create employee user
    const user = await prisma.user.create({
      data: {
        name: "Welcome Employee",
        email: "employee@example.com",
        password: hashedPassword,
        role: "EMPLOYEE",
      },
    });

    console.log("✅ User created:", user);

    // Create associated employee record
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        externalId: "EMP001",
      },
    });

    console.log("✅ Employee created:", employee);
    console.log("\n📝 Test Credentials:");
    console.log("Email: employee@example.com");
    console.log("Password: password");
    console.log("Role: EMPLOYEE");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestEmployee();
