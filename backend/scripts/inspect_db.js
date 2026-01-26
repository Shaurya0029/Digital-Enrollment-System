const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const employees = await prisma.employee.findMany({
      include: { dependents: true },
    });
    console.log("Employees and dependent counts:\n");
    for (const e of employees) {
      console.log(
        `Employee id=${e.id} userId=${e.userId} dependents=${e.dependents.length}`,
      );
      for (const d of e.dependents) {
        console.log(
          `  - Dependent id=${d.id} name=${d.name} policyId=${d.policyId || "null"}`,
        );
      }
    }
  } catch (err) {
    console.error("Error querying DB:", err);
  } finally {
    await prisma.$disconnect();
  }
})();
