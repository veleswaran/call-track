import mongoose from 'mongoose';
import dns from 'dns';
import { config } from './env.js';

// Resolve MongoDB SRV records via Google & Cloudflare DNS if local ISP DNS fails
if (config.mongodbUri.startsWith('mongodb+srv://')) {
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
      serverSelectionTimeoutMS: 5000,
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
