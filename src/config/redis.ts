import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

let _redis: any = null;

export function getRedis() {
  if (_redis) return _redis;
  if (process.env.NODE_ENV === 'test') {
    // lightweight stub used only during tests — BullMQ instances should also be stubbed in test mode
    _redis = {
      on: (_ev: string, _cb: Function) => {},
      disconnect: async () => {},
      quit: async () => {},
    } as any;
    return _redis;
  }

  _redis = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null, // recommended for BullMQ
  });

  _redis.on("connect", () => {
    console.log("🔌 Redis connected");
  });

  _redis.on("error", (err: any) => {
    console.error("Redis error:", err);
  });

  return _redis;
}
