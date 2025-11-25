"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderQueue = getOrderQueue;
exports.getOrderQueueScheduler = getOrderQueueScheduler;
exports.getOrderWorker = getOrderWorker;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
let _orderQueue = null;
let _orderQueueScheduler = null;
let _orderWorker = null;
function getOrderQueue() {
    if (_orderQueue)
        return _orderQueue;
    if (process.env.NODE_ENV === 'test') {
        _orderQueue = {
            add: async (name, data, opts) => ({ id: `test-${Date.now()}`, name, data, opts }),
            close: async () => { },
            getJob: async (id) => null,
        };
    }
    else {
        _orderQueue = new bullmq_1.Queue('order-queue', { connection: (0, redis_1.getRedis)() });
    }
    return _orderQueue;
}
function getOrderQueueScheduler() {
    if (_orderQueueScheduler)
        return _orderQueueScheduler;
    if (process.env.NODE_ENV === 'test') {
        _orderQueueScheduler = { close: async () => { } };
    }
    else {
        _orderQueueScheduler = new bullmq_1.QueueScheduler('order-queue', { connection: (0, redis_1.getRedis)() });
    }
    return _orderQueueScheduler;
}
function getOrderWorker(processor) {
    if (_orderWorker)
        return _orderWorker;
    if (process.env.NODE_ENV === 'test') {
        _orderWorker = {
            on: (_ev, _cb) => { },
            close: async () => { },
        };
    }
    else {
        _orderWorker = new bullmq_1.Worker('order-queue', processor ?? (async (job) => {
            console.log(`Processing order job: ${job.id}`);
            const orderData = job.data;
            return {
                status: 'processed',
                processedAt: new Date().toISOString(),
                originalOrder: orderData,
            };
        }), { connection: (0, redis_1.getRedis)() });
        _orderWorker.on('completed', (job) => {
            console.log(`Job completed: ${job.id}`);
        });
        _orderWorker.on('failed', (job, err) => {
            console.error(`Job failed: ${job?.id}`, err);
        });
    }
    return _orderWorker;
}
