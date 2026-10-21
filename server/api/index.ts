import { app } from '../src/app.js';
import { connectDB } from '../src/config/database.js';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (err: any) {
    console.error('[Vercel Serverless] DB connection failed:', err);
    return res.status(500).json({
      message: 'Database connection failed',
      error: err.message,
    });
  }

  return app(req, res);
}
