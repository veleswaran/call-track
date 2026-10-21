import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Ensure DB connection before processing requests (critical for serverless)
  app.use(async (_req, _res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
  });

  // CORS configuration for Next.js frontend and mobile devices
  app.use(
    cors({
      origin: (_origin, callback) => {
        callback(null, true); // Permissive CORS for dev and cloud clients
      },
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-XSRF-TOKEN',
        'X-Device-Token',
        'Accept',
      ],
      exposedHeaders: ['Content-Disposition'],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root healthcheck
  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'online',
      service: 'CallTrack Express API',
      version: '1.0.0',
    });
  });

  // Static uploads directory (for non-serverless local uploads)
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Mount API routes
  app.use(apiRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
