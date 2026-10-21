import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb+srv://veleswaran:Vels344@cluster0.nlwhzwz.mongodb.net/?appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET || 'fe5bdfe68fae02c0f22e65436944133182bc674e5b0cb0f8f972e539935a9bd6bb01c0c15c42936cebbecbda3c22e3fa56a0f65b93fd84aafcd037a0acd2c8fa',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim()),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@calltrack.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'password',
};
