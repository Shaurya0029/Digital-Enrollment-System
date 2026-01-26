const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async function () {
  try {
    // Check if Policy table exists
    const tables = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Policy';",
    );
    if (!tables || (Array.isArray(tables) && tables.length === 0)) {
      console.log("Creating Policy table");
      await prisma.$executeRawUnsafe(
        `CREATE TABLE Policy (id INTEGER PRIMARY KEY AUTOINCREMENT, policyNumber TEXT NOT NULL, name TEXT NOT NULL);`,
      );
    } else {
      console.log("Policy table exists");
    }

    // Check if Dependent has column policyId
    const cols = await prisma.$queryRawUnsafe(
      "PRAGMA table_info('Dependent');",
    );
    const hasPolicy =
      Array.isArray(cols) && cols.some((c) => c.name === "policyId");
    if (!hasPolicy) {
      console.log("Adding policyId column to Dependent");
      await prisma.$executeRawUnsafe(
        "ALTER TABLE Dependent ADD COLUMN policyId INTEGER",
      );
    } else {
      console.log("Dependent.policyId already exists");
    }

    console.log("Migration script complete");
  } catch (e) {
    console.error("Migration error", e);
  }
  await prisma.$disconnect();
})();
