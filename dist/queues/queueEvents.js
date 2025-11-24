"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderQueueEvents = void 0;
// src/queues/queueEvents.ts
const bullmq_1 = require("bullmq");
const connection = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: +(process.env.REDIS_PORT ?? 6379),
};
exports.orderQueueEvents = new bullmq_1.QueueEvents('order-queue', { connection });
