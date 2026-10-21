import { app } from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/env.js';

// Only start listening when not running inside a serverless platform (like Vercel / AWS Lambda)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  connectDB()
    .then(() => {
      app.listen(config.port, () => {
        console.log(`[CallTrack Express API] Server is running on http://localhost:${config.port}`);
        console.log(`[CallTrack Express API] Environment: ${config.nodeEnv}`);
      });
    })
    .catch((err) => {
      console.error('[CallTrack Express API] Startup error:', err);
    });
}

export default app;
