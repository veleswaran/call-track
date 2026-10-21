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

export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri, {
      dbName: 'calltrack',
    });
    console.log(`[MongoDB] Connected successfully to database: calltrack`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
}
