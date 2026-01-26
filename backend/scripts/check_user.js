const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async function () {
  try {
    const u = await prisma.user.findUnique({
      where: { email: "hr@example.com" },
    });
    console.log(JSON.stringify(u, null, 2));
  } catch (e) {
    console.error(e);
  }
  await prisma.$disconnect();
})();
