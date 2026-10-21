import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env.js';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // CORS configuration for Next.js frontend and mobile devices
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps, curl, or matching origin
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Dev-friendly permissive CORS
        }
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

  // Static uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Mount API routes
  app.use(apiRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
