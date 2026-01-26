import { Request, Response, NextFunction } from "express";

export const authorizeRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = String(user.role || "").toUpperCase();
    const required = String(role || "").toUpperCase();

    if (userRole !== required && !userRole.startsWith(required) && !required.startsWith(userRole)) {
      console.warn("Role mismatch: userRole=", userRole, "required=", required);
      return res.status(403).json({ error: "Access denied", userRole, required });
    }

    next();
  };
};

// Specific helpers for common checks
export const isHR = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const role = String(user.role || '').toUpperCase();
  if (!role.startsWith('HR')) return res.status(403).json({ error: 'Access denied: HR only' });
  next();
}

export const isEmployee = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const role = String(user.role || '').toUpperCase();
  if (role !== 'EMPLOYEE') return res.status(403).json({ error: 'Access denied: Employee only' });
  next();
}
