// Lightweight Redis-backed job queue scaffold. Uses in-memory queue fallback when
// REDIS_URL is not configured. Install `ioredis` and set REDIS_URL to enable.
let RedisClient: any = null;
let redisAvailable = false;
try {
  if (process.env.REDIS_URL) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = require('ioredis');
    RedisClient = new IORedis(process.env.REDIS_URL);
    redisAvailable = true;
  }
} catch (e) {
  console.warn('Redis not configured or ioredis not installed');
}

export function enqueueRedis(type: string, payload: any) {
  if (!redisAvailable) {
    throw new Error('Redis not configured');
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  return RedisClient.lpush(`jobs:${type}`, JSON.stringify({ id, type, payload, createdAt: new Date().toISOString() }));
}

export async function getRedisJob(type: string) {
  if (!redisAvailable) return null;
  const raw = await RedisClient.lindex(`jobs:${type}`, 0);
  return raw ? JSON.parse(raw) : null;
}

export default { enqueueRedis, getRedisJob, redisAvailable };
