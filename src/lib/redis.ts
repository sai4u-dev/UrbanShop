import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

function createClient() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });
  client.on("error", (err) => console.error("[redis] error:", err.message));
  return client;
}

export const redis = globalForRedis.redis ?? createClient();
if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// ─── Helpers ───
const CART_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const cartKeys = {
  byUser: (userId: string) => `cart:user:${userId}`,
  byGuest: (guestId: string) => `cart:guest:${guestId}`,
};

export async function cacheCart(key: string, payload: unknown) {
  await redis.set(key, JSON.stringify(payload), "EX", CART_TTL_SECONDS);
}

export async function getCachedCart<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function invalidateCart(key: string) {
  await redis.del(key);
}

// Simple fixed-window rate limiter: returns true if allowed
export async function rateLimit(key: string, limit = 60, windowSec = 60): Promise<boolean> {
  const count = await redis.incr(`rl:${key}`);
  if (count === 1) await redis.expire(`rl:${key}`, windowSec);
  return count <= limit;
}
