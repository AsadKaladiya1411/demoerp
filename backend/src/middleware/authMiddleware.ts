import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret());
    // attach user info to request
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
