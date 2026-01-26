import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { prisma } from "../prisma";

export const employeeRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    // Only HR should request full employee lists; enforce on caller if necessary
    const emps = await prisma.employee.findMany({
      include: {
        user: true,
        dependents: true,
        policies: { include: { policy: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return emps.map((e) => ({
      id: e.id,
      userId: e.userId,
      name: e.user?.name || "",
      email: e.user?.email || "",
      phone: e.phone,
      dob: e.dob,
      gender: e.gender,
      address: e.address,
      maritalStatus: e.maritalStatus,
      externalId: e.externalId,
      user: { id: e.userId, name: e.user?.name, email: e.user?.email },
      dependents: e.dependents,
      policies: e.policies,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      const emp = await prisma.employee.findUnique({
        where: { id: input },
        include: {
          user: true,
          dependents: true,
          policies: { include: { policy: true } },
        },
      });
      if (!emp) throw new Error("Employee not found");
      return {
        id: emp.id,
        userId: emp.userId,
        name: emp.user?.name || "",
        email: emp.user?.email || "",
        phone: emp.phone,
        dob: emp.dob,
        gender: emp.gender,
        address: emp.address,
        maritalStatus: emp.maritalStatus,
        externalId: emp.externalId,
        user: { id: emp.userId, name: emp.user?.name, email: emp.user?.email },
        dependents: emp.dependents,
        policies: emp.policies,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
        phone: z.string().optional(),
        dob: z.string().datetime().optional(),
        gender: z.string().optional(),
        address: z.string().optional(),
        maritalStatus: z.string().optional(),
        externalId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "HR") throw new Error("FORBIDDEN");
      const existing = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) throw new Error("User already exists");
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: input.password,
          role: "EMPLOYEE",
        },
      });
      const employee = await prisma.employee.create({
        data: {
          userId: user.id,
          phone: input.phone,
          dob: input.dob ? new Date(input.dob) : undefined,
          gender: input.gender,
          address: input.address,
          maritalStatus: input.maritalStatus,
          externalId: input.externalId,
        },
        include: { user: true },
      });
      return {
        id: employee.id,
        userId: employee.userId,
        name: user.name,
        email: user.email,
        phone: employee.phone,
        dob: employee.dob,
        gender: employee.gender,
        address: employee.address,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        dob: z.string().datetime().optional(),
        gender: z.string().optional(),
        address: z.string().optional(),
        maritalStatus: z.string().optional(),
        externalId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "HR") throw new Error("FORBIDDEN");
      const { id, ...updateData } = input;

      const employee = await prisma.employee.findUnique({
        where: { id },
        include: { user: true },
      });
      if (!employee) throw new Error("Employee not found");

      const updatedEmployee = await prisma.employee.update({
        where: { id },
        data: {
          phone: updateData.phone,
          dob: updateData.dob ? new Date(updateData.dob) : undefined,
          gender: updateData.gender,
          address: updateData.address,
          maritalStatus: updateData.maritalStatus,
          externalId: updateData.externalId,
        },
        include: { user: true },
      });

      // Update user if name or email provided
      if (updateData.name || updateData.email) {
        await prisma.user.update({
          where: { id: employee.userId },
          data: {
            name: updateData.name,
            email: updateData.email,
          },
        });
      }

      return updatedEmployee;
    }),

  bulkCreate: protectedProcedure
    .input(
      z.array(
        z.object({
          name: z.string().min(1, "Name required"),
          email: z.string().email("Invalid email"),
          password: z.string().min(1, "Password required"),
          phone: z.string().optional(),
          dob: z.string().optional(),
          gender: z.string().optional(),
          address: z.string().optional(),
          maritalStatus: z.string().optional(),
          externalId: z.string().optional(),
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "HR") throw new Error("FORBIDDEN");

      const results = {
        successCount: 0,
        failureCount: 0,
        errors: [] as Array<{ row: number; reason: string }>,
        created: [] as any[],
      };

      for (let i = 0; i < input.length; i++) {
        const row = input[i];
        try {
          // Check if user already exists
          const existing = await prisma.user.findUnique({
            where: { email: row.email },
          });
          if (existing) {
            results.failureCount++;
            results.errors.push({
              row: i + 1,
              reason: `Email already exists: ${row.email}`,
            });
            continue;
          }

          // Create user and employee
          const user = await prisma.user.create({
            data: {
              name: row.name,
              email: row.email,
              password: row.password,
              role: "EMPLOYEE",
            },
          });

          const employee = await prisma.employee.create({
            data: {
              userId: user.id,
              phone: row.phone,
              dob: row.dob ? new Date(row.dob) : undefined,
              gender: row.gender,
              address: row.address,
              maritalStatus: row.maritalStatus,
              externalId: row.externalId,
            },
            include: { user: true },
          });

          results.successCount++;
          results.created.push({
            id: employee.id,
            name: user.name,
            email: user.email,
          });
        } catch (err: any) {
          results.failureCount++;
          results.errors.push({
            row: i + 1,
            reason: err.message || "Unknown error",
          });
        }
      }

      return results;
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "HR") throw new Error("FORBIDDEN");
      const employee = await prisma.employee.findUnique({
        where: { id: input },
        include: { user: true },
      });
      if (!employee) throw new Error("Employee not found");
      
      // Delete employee
      await prisma.employee.delete({ where: { id: input } });
      
      // Delete associated user
      await prisma.user.delete({ where: { id: employee.userId } }).catch(() => null);
      
      return { message: "Employee deleted successfully" };
    }),
});
