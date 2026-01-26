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

  const user = await prisma.user.findUnique({
    where: { email: req.body.email },
  });

  console.log("USER FOUND:", user);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const valid = await bcrypt.compare(req.body.password, user.password);
  console.log("PASSWORD MATCH:", valid);

  if (!valid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );

  return res.json({ token, role: user.role });
};
