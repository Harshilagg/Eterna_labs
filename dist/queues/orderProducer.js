"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderQueue = void 0;
exports.enqueueOrder = enqueueOrder;
const bullmq_1 = require("bullmq");
const connection = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: +(process.env.REDIS_PORT ?? 6379),
};
exports.orderQueue = new bullmq_1.Queue('order-queue', { connection });
async function enqueueOrder(orderId, payload) {
    const job = await exports.orderQueue.add('process-order', { orderId, payload }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
    });
    return job;
}
