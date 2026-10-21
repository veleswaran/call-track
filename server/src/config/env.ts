import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/calltrack',
  jwtSecret: process.env.JWT_SECRET || 'calltrack-secret-key-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim()),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@calltrack.test',
  adminPassword: process.env.ADMIN_PASSWORD || 'password',
};
