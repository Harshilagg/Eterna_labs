"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderQueueEvents = void 0;
exports.getOrderQueueEvents = getOrderQueueEvents;
// src/queues/queueEvents.ts
const bullmq_1 = require("bullmq");
const connection = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: +(process.env.REDIS_PORT ?? 6379),
};
let _events = null;
function getOrderQueueEvents() {
    if (_events)
        return _events;
    if (process.env.NODE_ENV === 'test') {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const bullmq = require('bullmq');
            if (bullmq && typeof bullmq.QueueEvents === 'function' && bullmq.QueueEvents._isMockFunction) {
                _events = new bullmq.QueueEvents('order-queue', { connection });
            }
            else {
                _events = {
                    on: (_, __) => { },
                    close: async () => { },
                };
            }
        }
        catch (e) {
            _events = {
                on: (_, __) => { },
                close: async () => { },
            };
        }
    }
    else {
        _events = new bullmq_1.QueueEvents('order-queue', { connection });
    }
    return _events;
}
exports.orderQueueEvents = getOrderQueueEvents();
