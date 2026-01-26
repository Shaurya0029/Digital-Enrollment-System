import { prisma } from "./prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export async function createContext({ req }: { req: any }) {
  const auth = req.headers.authorization || "";
  let user: { userId?: number; role?: string } | null = null;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      user = { userId: payload.userId, role: payload.role };
    } catch (e) {
      user = null;
    }
  }
  return { prisma, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
