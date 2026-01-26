import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const decoded = jwt.verify(token, secret) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    console.error('JWT verify failed', err);
    return res.status(401).json({ error: "Invalid token" });
  }
  console.log("TOKEN RECEIVED:", token);
  console.log("AUTH HEADER:", req.headers.authorization);
};
