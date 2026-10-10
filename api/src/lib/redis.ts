// redis.ts — shared Redis client
// Used for: JWT jti blacklist, subscription cache (tier enforcement), unread counts

import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:16379', {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err: Error) => {
  console.error('Redis error:', err);
});
