import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(){
  console.log('Clearing employees, dependents and employee-policy links...')

  // Remove employee-policy links first
  await prisma.employeePolicy.deleteMany({})

  // Remove dependents
  await prisma.dependent.deleteMany({})

  // Remove employees
  await prisma.employee.deleteMany({})

  // Remove user accounts with role EMPLOYEE (keep HR_MANAGER)
  await prisma.user.deleteMany({ where: { role: 'EMPLOYEE' } })

  console.log('Done.')
}

main().catch(e=>{
  console.error(e)
  process.exit(1)
}).finally(async ()=>{
  await prisma.$disconnect()
})
