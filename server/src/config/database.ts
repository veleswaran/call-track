import mongoose from 'mongoose';
import dns from 'dns';
import { config } from './env.js';

// Only set custom DNS fallback on local machine, never on cloud environments (like Vercel / AWS Lambda)
if (
  !process.env.VERCEL &&
  !process.env.AWS_REGION &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME &&
  config.mongodbUri.startsWith('mongodb+srv://')
) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if not supported in environment
  }
}

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<void> {
  // If already connected, reuse connection
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (!cachedPromise) {
    mongoose.set('strictQuery', true);
    cachedPromise = mongoose.connect(config.mongodbUri, {
      dbName: 'calltrack',
      serverSelectionTimeoutMS: 8000,
    });
  }

  try {
    await cachedPromise;
    console.log(`[MongoDB] Connected successfully to database: calltrack`);
  } catch (error) {
    cachedPromise = null;
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
}
