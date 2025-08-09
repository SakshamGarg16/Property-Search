// src/services/amenityCache.service.ts
import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || '';
let redisClient: RedisClientType | null = null;
if (REDIS_URL) {
  redisClient = createClient({ url: REDIS_URL });
  redisClient.connect().catch((e) => {
    console.warn('Redis connect failed, falling back to memory cache', e.message);
    redisClient = null;
  });
}

type CacheItem = { expiresAt: number; data: any };
const memoryCache = new Map<string, CacheItem>();

export const AmenityCache = {
  async get(key: string) {
    if (redisClient) {
      const s = await redisClient.get(key);
      return s ? JSON.parse(s) : null;
    } else {
      const it = memoryCache.get(key);
      if (!it) return null;
      if (Date.now() > it.expiresAt) {
        memoryCache.delete(key);
        return null;
      }
      return it.data;
    }
  },

  async set(key: string, data: any, ttlSeconds = 3600) {
    if (redisClient) {
      await redisClient.set(key, JSON.stringify(data), { EX: ttlSeconds });
    } else {
      memoryCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
    }
  },
};