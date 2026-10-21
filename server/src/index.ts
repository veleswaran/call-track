import { createApp } from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/env.js';

async function bootstrap() {
  await connectDB();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`[CallTrack Express API] Server is running on http://localhost:${config.port}`);
    console.log(`[CallTrack Express API] Environment: ${config.nodeEnv}`);
  });
}

bootstrap().catch((err) => {
  console.error('[CallTrack Express API] Fatal startup error:', err);
  process.exit(1);
});
