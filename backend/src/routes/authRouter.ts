import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const DEMO_USERS = [
  { id: 'boss-1', username: 'admin', password: 'admin123', name: 'Sadiq Sir', role: 'Boss' },
  { id: 'boss-2', username: 'admin2', password: 'admin123', name: 'Sabnam Mam', role: 'Boss' },
  { id: 'employee-a', username: 'empa', password: 'empa123', name: 'Gokulbhai', role: 'Employee A' },
  { id: 'employee-b', username: 'empb', password: 'empb123', name: 'Parthbhai', role: 'Employee B' },
  { id: 'employee-c', username: 'empc', password: 'empc123', name: 'Yougeshbhai', role: 'Employee C' },
  { id: 'employee-d', username: 'empd', password: 'empd123', name: 'Kushalbhai', role: 'Employee D' },
  { id: 'rnd-1', username: 'rnd', password: 'rnd123', name: 'R&D', role: 'Employee A' },
];

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = DEMO_USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, name: user.name, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

router.get('/session', (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET || 'dev-secret') as jwt.JwtPayload;
    res.json({ user: { id: payload.sub, name: payload.name, role: payload.role } });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

export default router;
