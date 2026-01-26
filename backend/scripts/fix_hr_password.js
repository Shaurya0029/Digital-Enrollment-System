const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();
(async function () {
  try {
    const hashed = await bcrypt.hash("password123", 10);
    const updated = await prisma.user.update({
      where: { email: "hr@example.com" },
      data: { password: hashed },
    });
    console.log("Updated user password for", updated.email);
  } catch (e) {
    console.error(e);
  }
  await prisma.$disconnect();
})();
