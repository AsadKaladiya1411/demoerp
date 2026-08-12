import express from 'express';
import cors from 'cors';
import authRouter from './routes/authRouter';
import stateRouter from './routes/stateRouter';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config';

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
}));
app.use(express.json({ limit: '5mb' }));

app.use('/api', authRouter);
app.use('/api', stateRouter);

app.get('/', (_req: Request, res: Response) => res.json({ ok: true }));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  res.status(500).json({ error: message });
});

app.listen(config.port, () => console.log(`Backend listening on port ${config.port}`));

