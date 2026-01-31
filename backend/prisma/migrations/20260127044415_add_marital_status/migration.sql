-- AlterTable
ALTER TABLE "Dependent" ADD COLUMN "dob" DATETIME;
ALTER TABLE "Dependent" ADD COLUMN "gender" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "maritalStatus" TEXT;

-- AlterTable
ALTER TABLE "Policy" ADD COLUMN "description" TEXT;
