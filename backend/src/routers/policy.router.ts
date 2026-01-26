import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { prisma } from "../prisma";

export const policyRouter = router({
  list: publicProcedure.query(async () => {
    return prisma.policy.findMany({
      include: { dependents: true, employees: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  get: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return prisma.policy.findUnique({
        where: { id: input },
        include: { dependents: true, employees: true },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        policyNumber: z.string().min(1, "Policy code is required"),
        name: z.string().min(1, "Policy name is required"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "HR") throw new Error("FORBIDDEN");

      // Check for duplicate policyNumber
      const existing = await prisma.policy.findUnique({
        where: { policyNumber: input.policyNumber },
      });
      if (existing) {
        throw new Error("Policy code already exists");
      }

      return prisma.policy.create({
        data: {
          policyNumber: input.policyNumber,
          name: input.name,
          description: input.description,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        policyNumber: z.string().min(1, "Policy code is required").optional(),
        name: z.string().min(1, "Policy name is required").optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "HR") throw new Error("FORBIDDEN");

      const { id, ...updateData } = input;

      // Check if new policyNumber already exists on another policy
      if (updateData.policyNumber) {
        const existing = await prisma.policy.findUnique({
          where: { policyNumber: updateData.policyNumber },
        });
        if (existing && existing.id !== id) {
          throw new Error("Policy code already exists");
        }
      }

      return prisma.policy.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "HR") throw new Error("FORBIDDEN");

      return prisma.policy.delete({
        where: { id: input },
      });
    }),

  assignDependent: protectedProcedure
    .input(z.object({ policyId: z.number(), dependentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "HR") throw new Error("FORBIDDEN");
      const dep = await prisma.dependent.update({
        where: { id: input.dependentId },
        data: { policyId: input.policyId },
      });
      return dep;
    }),

  unassignDependent: protectedProcedure
    .input(z.object({ policyId: z.number(), dependentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "HR") throw new Error("FORBIDDEN");
      const dep = await prisma.dependent.update({
        where: { id: input.dependentId },
        data: { policyId: null },
      });
      return dep;
    }),
});
