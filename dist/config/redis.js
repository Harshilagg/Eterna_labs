"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
const ioredis_1 = require("ioredis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
let _redis = null;
function getRedis() {
    if (_redis)
        return _redis;
    if (process.env.NODE_ENV === 'test') {
        // lightweight stub used only during tests — BullMQ instances should also be stubbed in test mode
        _redis = {
            on: (_ev, _cb) => { },
            disconnect: async () => { },
            quit: async () => { },
        };
        return _redis;
    }
    _redis = new ioredis_1.Redis({
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: null, // recommended for BullMQ
    });
    _redis.on("connect", () => {
        console.log("🔌 Redis connected");
    });
    _redis.on("error", (err) => {
        console.error("Redis error:", err);
    });
    return _redis;
}
