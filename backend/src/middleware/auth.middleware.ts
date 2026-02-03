import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Authentication Middleware
 * 
 * Verifies JWT token from Authorization header
 * Attaches decoded user info to request object
 * Returns 401 if token is missing or invalid
 * 
 * Usage: app.get('/protected', authenticate, (req, res) => {...})
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.warn('[Auth Middleware] ❌ Token missing from Authorization header');
    return res.status(401).json({ error: "Token missing" });
  }

  const token = authHeader.split(" ")[1];
  
  if (!token) {
    console.warn('[Auth Middleware] ❌ Invalid authorization header format');
    return res.status(401).json({ error: "Invalid authorization header format" });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const decoded = jwt.verify(token, secret) as any;
    
    console.log('[Auth Middleware] ✅ Token verified', {
      userId: decoded.userId,
      role: decoded.role,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // Attach user info to request for use in route handlers
    (req as any).user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    
    next();
  } catch (err) {
    console.error('[Auth Middleware] ❌ JWT verification failed:', {
      error: err instanceof Error ? err.message : String(err),
      token: token.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
