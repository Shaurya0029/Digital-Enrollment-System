import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "HR",
      },
    });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: "User already exists" });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log("LOGIN BODY:", req.body);

  const { email, password, role, emailOrId } = req.body;
  const loginEmail = email || emailOrId;

  const user = await prisma.user.findUnique({
    where: { email: loginEmail },
  });

  console.log("USER FOUND:", user);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Validate password
  const valid = await bcrypt.compare(password, user.password);
  console.log("PASSWORD MATCH:", valid);

  if (!valid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // Validate role if provided
  if (role) {
    const normalizedRequestRole = String(role).toUpperCase();
    const normalizedUserRole = String(user.role).toUpperCase();
    
    if (!normalizedUserRole.startsWith(normalizedRequestRole.substring(0, 2))) {
      return res.status(403).json({ 
        error: `Role mismatch: your account role is ${user.role}, but you're trying to log in as ${role}` 
      });
    }
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );

  return res.json({ token, role: user.role });
};
