import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { prisma } from "../prisma";

export const dependentRouter = router({
  list: publicProcedure.query(async () => {
    return prisma.dependent.findMany();
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        relation: z.string(),
        employeeId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // HR can create for any employee; employee can create for themselves
      if (ctx.user?.role !== "HR" && ctx.user?.userId !== input.employeeId)
        throw new Error("FORBIDDEN");
      const dep = await prisma.dependent.create({
        data: {
          name: input.name,
          relation: input.relation,
          employeeId: input.employeeId,
        },
      });
      return dep;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        relation: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const dep = await prisma.dependent.findUnique({
        where: { id: input.id },
      });
      if (!dep) throw new Error("Not found");
      // If dependent has policy, prevent deletion but allow update
      const allowed =
        ctx.user?.role === "HR" || ctx.user?.userId === dep.employeeId;
      if (!allowed) throw new Error("FORBIDDEN");
      const updated = await prisma.dependent.update({
        where: { id: input.id },
        data: {
          name: input.name ?? undefined,
          relation: input.relation ?? undefined,
        },
      });
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const dep = await prisma.dependent.findUnique({
        where: { id: input.id },
      });
      if (!dep) throw new Error("Not found");
      if (dep.policyId)
        throw new Error("Cannot delete dependent assigned to a policy");
      const allowed =
        ctx.user?.role === "HR" || ctx.user?.userId === dep.employeeId;
      if (!allowed) throw new Error("FORBIDDEN");
      await prisma.dependent.delete({ where: { id: input.id } });
      return { message: "Deleted" };
    }),
});
