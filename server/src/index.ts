import { app } from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/env.js';

// Standalone local server listener
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

// Support both ES module and CommonJS export styles for Vercel Serverless Function compatibility
export default app;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  module.exports.default = app;
}
