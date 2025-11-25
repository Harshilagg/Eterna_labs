"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorker = startWorker;
// src/workers/orderWorker.ts
require("dotenv/config");
const bullmq_1 = require("bullmq");
const orderQueue_1 = require("../queues/orderQueue");
const mockDex_1 = require("../dex/mockDex");
const uuid_1 = require("uuid");
const db_1 = require("../config/db");
let _worker = null;
// processor function implementing the lifecycle for a job
async function processor(job) {
    console.log(`[worker] processing job ${job.id} name=${job.name}`);
    const { orderId, payload } = job.data;
    try {
        // pending -> routing
        await job.updateProgress({ status: 'routing' });
        await (0, db_1.updateOrderStatus)(orderId, 'routing');
        // fetch quotes in parallel
        const [r, m] = await Promise.all([(0, mockDex_1.getRaydiumQuote)(payload?.amount ?? 1), (0, mockDex_1.getMeteoraQuote)(payload?.amount ?? 1)]);
        const chosen = (0, mockDex_1.chooseBestQuote)(r, m);
        await job.updateProgress({ status: 'building', chosen });
        await (0, db_1.updateOrderStatus)(orderId, 'building');
        // simulate building transaction
        await new Promise((r) => setTimeout(r, 700 + Math.random() * 700));
        // simulate submit
        const txHash = `0x${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 40)}`;
        await job.updateProgress({ status: 'submitted', txHash, chosen });
        await (0, db_1.updateOrderStatus)(orderId, 'submitted');
        // simulate network confirmation
        await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));
        const result = {
            status: 'confirmed',
            txHash,
            executedAt: new Date().toISOString(),
            executedPrice: chosen.price,
            dex: chosen.dex,
        };
        await job.updateProgress({ status: 'confirmed', result });
        await (0, db_1.updateOrderStatus)(orderId, 'confirmed', result);
        return result;
    }
    catch (err) {
        console.error('[worker] job failed', job.id, err);
        await job.updateProgress({ status: 'failed', reason: err?.message ?? String(err) });
        await (0, db_1.markOrderFailed)(orderId, err?.message ?? String(err));
        throw err;
    }
}
async function startWorker() {
    if (_worker)
        return _worker;
    const connection = {
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: +(process.env.REDIS_PORT ?? 6379),
    };
    console.log('[worker] starting — connecting to Redis at', connection);
    // ensure scheduler is referenced
    const scheduler = orderQueue_1.orderQueueScheduler;
    _worker = new bullmq_1.Worker('order-queue', processor, { connection, concurrency: 10 });
    _worker.on('completed', (job) => {
        console.log(`[worker] job ${job.id} completed`);
    });
    _worker.on('failed', (job, err) => {
        console.error(`[worker] job ${job?.id} failed:`, err);
    });
    // graceful shutdown
    const shutDown = async () => {
        console.log('[worker] shutting down');
        await _worker.close();
        await scheduler.close();
        process.exit(0);
    };
    if (process.env.NODE_ENV !== 'test') {
        process.on('SIGINT', shutDown);
        process.on('SIGTERM', shutDown);
    }
    return _worker;
}
// When run directly, start the worker
if (require.main === module) {
    startWorker().catch((err) => {
        console.error('Failed to start worker', err);
        process.exit(1);
    });
}
