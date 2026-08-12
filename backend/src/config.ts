import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  isProduction,
  port: process.env.PORT || '4000',
  jwtSecret: process.env.JWT_SECRET || '',
  allowedOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
};

if (config.isProduction && !config.jwtSecret) {
  throw new Error('JWT_SECRET is required in production');
}

if (config.isProduction && config.allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGIN is required in production');
}

export function getJwtSecret() {
  if (config.jwtSecret) return config.jwtSecret;
  return 'dev-secret';
}
