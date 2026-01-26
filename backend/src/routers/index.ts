import { router } from "../trpc";
import { authRouter } from "./auth.router";
import { employeeRouter } from "./employee.router";
import { dependentRouter } from "./dependent.router";
import { policyRouter } from "./policy.router";

export const appRouter = router({
  auth: authRouter,
  employees: employeeRouter,
  dependents: dependentRouter,
  policies: policyRouter,
});

export type AppRouter = typeof appRouter;
// tRPC routers removed — migration canceled. Keep file as placeholder.

export {};
