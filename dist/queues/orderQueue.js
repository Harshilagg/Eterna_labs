"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderQueueScheduler = exports.orderQueue = void 0;
exports.getOrderQueue = getOrderQueue;
exports.getOrderQueueScheduler = getOrderQueueScheduler;
// src/queues/orderQueue.ts
const bullmq_1 = require("bullmq");
const connection = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: +(process.env.REDIS_PORT ?? 6379),
    // password: process.env.REDIS_PASSWORD, // uncomment if needed
};
let _queue = null;
let _scheduler = null;
function getOrderQueue() {
    if (_queue)
        return _queue;
    if (process.env.NODE_ENV === 'test') {
        // If tests created a jest mock for 'bullmq', prefer using that mocked Queue implementation
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const bullmq = require('bullmq');
            if (bullmq && typeof bullmq.Queue === 'function' && bullmq.Queue._isMockFunction) {
                _queue = new bullmq.Queue('order-queue', { connection });
            }
            else {
                // default in-memory stub
                _queue = {
                    add: async (name, data, opts) => ({ id: `test-${Date.now()}`, name, data, opts }),
                    close: async () => { },
                    getJob: async (id) => null,
                };
            }
        }
        catch (e) {
            _queue = {
                add: async (name, data, opts) => ({ id: `test-${Date.now()}`, name, data, opts }),
                close: async () => { },
                getJob: async (id) => null,
            };
        }
    }
    else {
        _queue = new bullmq_1.Queue('order-queue', { connection });
    }
    return _queue;
}
function getOrderQueueScheduler() {
    if (_scheduler)
        return _scheduler;
    if (process.env.NODE_ENV === 'test') {
        _scheduler = { close: async () => { } };
    }
    else {
        _scheduler = new bullmq_1.QueueScheduler('order-queue', { connection });
    }
    return _scheduler;
}
exports.orderQueue = getOrderQueue();
exports.orderQueueScheduler = getOrderQueueScheduler();
