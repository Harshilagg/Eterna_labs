"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
exports.redis = new ioredis_1.Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null, // recommended for BullMQ
});
exports.redis.on("connect", () => {
    console.log("🔌 Redis connected");
});
exports.redis.on("error", (err) => {
    console.error("Redis error:", err);
});
