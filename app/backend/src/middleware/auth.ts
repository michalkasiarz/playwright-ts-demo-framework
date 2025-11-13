import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../auth/jwt';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  console.log('Auth middleware - cookies:', req.cookies);
  console.log('Auth middleware - token found:', !!token);
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
