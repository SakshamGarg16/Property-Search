// src/config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

export async function connectDB() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI not set in .env');
    }

    await mongoose.connect(MONGO_URI, {
      // recommended mongoose options (Mongoose v7+ uses sensible defaults)
      // keep these explicit for clarity and TLS issues
      autoIndex: true,
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      // tls: true, // usually not required; leave commented unless needed
    });

    console.log('MongoDB connected');
  } catch (err: any) {
    console.error('MongoDB connection failed', err.message || err);
    throw err;
  }
}
