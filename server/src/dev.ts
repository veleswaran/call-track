import { app } from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/env.js';

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
