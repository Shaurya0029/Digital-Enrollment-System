import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// simple in-memory OTP store for demo (email -> { code, expiresAt })
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const { email, password } = input;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("Invalid credentials");
      if (user.password?.startsWith("$2")) {
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new Error("Invalid credentials");
      } else {
        if (user.password !== password) throw new Error("Invalid credentials");
      }
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "8h",
      });
      return { token, role: user.role };
    }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, email, password } = input;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new Error("User already exists");
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashed, role: "EMPLOYEE" },
      });
      return { id: user.id, email: user.email };
    }),

  // Request OTP (mock) — returns the code in response for local dev convenience
  requestOtp: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + 1000 * 60 * 5; // 5 minutes
      otpStore.set(email, { code, expiresAt });
      // In production you'd send the code via email/SMS; for local dev we return it
      return { message: "OTP generated (dev-only)", code };
    }),

  // Verify OTP and sign-in / create user
  verifyOtp: publicProcedure
    .input(z.object({ email: z.string().email(), code: z.string() }))
    .mutation(async ({ input }) => {
      const { email, code } = input;
      const entry = otpStore.get(email);
      if (!entry) throw new Error("No OTP requested");
      if (Date.now() > entry.expiresAt) {
        otpStore.delete(email);
        throw new Error("OTP expired");
      }
      if (entry.code !== code) throw new Error("Invalid OTP");
      otpStore.delete(email);
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { name: email.split("@")[0], email, password: "", role: "EMPLOYEE" },
        });
        await prisma.employee.create({ data: { userId: user.id } }).catch(() => null);
      }
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
      return { token, role: user.role };
    }),
});

export {};
