"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderQueueScheduler = exports.orderQueue = void 0;
// src/queues/orderQueue.ts
const bullmq_1 = require("bullmq");
const connection = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: +(process.env.REDIS_PORT ?? 6379),
    // password: process.env.REDIS_PASSWORD, // uncomment if needed
};
exports.orderQueue = new bullmq_1.Queue('order-queue', { connection });
/**
 * QueueScheduler is recommended for delayed/retry jobs and cleaning locks.
 * Start one scheduler per queue (can be in same process or a separate one).
 */
exports.orderQueueScheduler = new bullmq_1.QueueScheduler('order-queue', { connection });
