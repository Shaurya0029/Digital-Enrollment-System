import { initTRPC } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

/* -------------------- ROUTER & PROCEDURES -------------------- */
export const router = t.router;
export const publicProcedure = t.procedure;

/* -------------------- AUTH MIDDLEWARE -------------------- */
export const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.user.userId) {
    throw new Error("UNAUTHORIZED");
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
