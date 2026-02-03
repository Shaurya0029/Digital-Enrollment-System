import { Request, Response, NextFunction } from "express";

/**
 * Generic Role Authorization Middleware
 * 
 * Verifies user has required role
 * Returns 403 if role doesn't match
 * 
 * Usage: app.get('/admin', authenticate, authorizeRole('ADMIN'), (req, res) => {...})
 */
export const authorizeRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: No user found" });
    }

    const userRole = String(user.role || "").toUpperCase().trim();
    const requiredRole = String(role || "").toUpperCase().trim();

    // Check if user role matches or starts with required role
    if (userRole !== requiredRole && !userRole.startsWith(requiredRole)) {
      console.warn(`[RBAC] Role mismatch: user=${userRole}, required=${requiredRole}`);
      return res.status(403).json({ 
        error: "Access denied: Insufficient role",
        userRole,
        requiredRole
      });
    }

    next();
  };
};

/**
 * HR-Only Authorization Middleware
 * 
 * Allows access only to users with HR role
 * Returns 401 if not authenticated
 * Returns 403 if not HR role
 * 
 * Usage: app.get('/hr/dashboard', authenticate, isHR, (req, res) => {...})
 */
export const isHR = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    console.warn('[HR Middleware] ❌ No user attached to request');
    return res.status(401).json({ error: "Unauthorized: No user found" });
  }
  
  const userRole = String(user.role || "").toUpperCase().trim();
  
  if (!userRole.startsWith("HR")) {
    console.warn('[HR Middleware] ❌ HR access denied', {
      userId: user.userId,
      userRole,
      requiredRole: 'HR',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    return res.status(403).json({ 
      error: "Access denied: HR access required",
      userRole
    });
  }

  console.log('[HR Middleware] ✅ HR access granted', {
    userId: user.userId,
    userRole,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  next();
};

/**
 * Employee-Only Authorization Middleware
 * 
 * Allows access only to users with EMPLOYEE role
 * Returns 401 if not authenticated
 * Returns 403 if not EMPLOYEE role
 * 
 * Usage: app.get('/employee/profile', authenticate, isEmployee, (req, res) => {...})
 */
export const isEmployee = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: No user found" });
  }
  
  const userRole = String(user.role || "").toUpperCase().trim();
  
  if (userRole !== "EMPLOYEE") {
    console.warn(`[RBAC] Employee access denied for user with role: ${userRole}`);
    return res.status(403).json({ 
      error: "Access denied: Employee access required",
      userRole
    });
  }
  
  next();
};

/**
 * HR Verification Middleware (Alias for isHR)
 * 
 * Verifies JWT token is present and contains HR role
 * Returns 401 if token missing or invalid
 * Returns 403 if user role is not HR
 * 
 * Usage: router.post('/employees', authenticate, verifyHR, createEmployee)
 */
export const verifyHR = isHR;
