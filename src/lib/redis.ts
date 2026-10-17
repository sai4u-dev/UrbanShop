import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

function createClient() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  // Don't spam build logs — ioredis retries in background
  client.on("error", () => {});
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
  try {
    await redis.set(key, JSON.stringify(payload), "EX", CART_TTL_SECONDS);
  } catch {
    // Redis down — cart still persists in Postgres
  }
}

export async function getCachedCart<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function invalidateCart(key: string) {
  try {
    await redis.del(key);
  } catch {
    // ignore
  }
}

// Simple fixed-window rate limiter: returns true if allowed
// Fails open when Redis is unavailable (e.g. during build).
export async function rateLimit(key: string, limit = 60, windowSec = 60): Promise<boolean> {
  try {
    const count = await redis.incr(`rl:${key}`);
    if (count === 1) await redis.expire(`rl:${key}`, windowSec);
    return count <= limit;
  } catch {
    return true;
  }
}
