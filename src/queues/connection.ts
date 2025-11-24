// src/queue/connection.ts
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    // exponential-ish backoff (ms) capped at 5s
    return Math.min(200 + times * 200, 5000);
  },
  // Optionally adjust connectTimeout if you need
  // connectTimeout: 10000,
});

redis.on("error", (err) => {
  console.error("Redis error:", err && err.message ? err.message : err);
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("ready", () => {
  console.log("Redis ready");
});
