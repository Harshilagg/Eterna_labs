import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null, // recommended for BullMQ
});

redis.on("connect", () => {
  console.log("🔌 Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});
