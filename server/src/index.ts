import { app } from './app.js';
import { connectDB } from './config/database.js';

// Vercel Serverless Function entrypoint
export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (err: any) {
    console.error('[Vercel Serverless] Database connection failed:', err);
    return res.status(500).json({
      message: 'Database connection failed',
      error: err?.message || String(err),
    });
  }

  return app(req, res);
}

// CommonJS compatibility for Vercel
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  module.exports.default = handler;
}
