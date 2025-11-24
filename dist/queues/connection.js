"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
// src/queue/connection.ts
const ioredis_1 = __importDefault(require("ioredis"));
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
exports.redis = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        // exponential-ish backoff (ms) capped at 5s
        return Math.min(200 + times * 200, 5000);
    },
    // Optionally adjust connectTimeout if you need
    // connectTimeout: 10000,
});
exports.redis.on("error", (err) => {
    console.error("Redis error:", err && err.message ? err.message : err);
});
exports.redis.on("connect", () => {
    console.log("Redis connected");
});
exports.redis.on("ready", () => {
    console.log("Redis ready");
});
