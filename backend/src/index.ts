import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/authRouter';
import stateRouter from './routes/stateRouter';
import type { NextFunction, Request, Response } from 'express';
dotenv.config();

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(origin => origin.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '5mb' }));

app.use('/api', authRouter);
app.use('/api', stateRouter);

const PORT = process.env.PORT || 4000;

app.get('/', (_req: Request, res: Response) => res.json({ ok: true }));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  res.status(500).json({ error: message });
});

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));

