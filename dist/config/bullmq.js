"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderWorker = exports.orderQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
exports.orderQueue = new bullmq_1.Queue("order-queue", {
    connection: redis_1.redis,
});
// Prevent stalled jobs
new bullmq_1.QueueScheduler("order-queue", {
    connection: redis_1.redis,
});
// Worker to process orders
exports.orderWorker = new bullmq_1.Worker("order-queue", async (job) => {
    console.log(`Processing order job: ${job.id}`);
    const orderData = job.data;
    // Simulate processing (later replaced with real logic)
    return {
        status: "processed",
        processedAt: new Date().toISOString(),
        originalOrder: orderData,
    };
}, {
    connection: redis_1.redis,
});
exports.orderWorker.on("completed", (job) => {
    console.log(`Job completed: ${job.id}`);
});
exports.orderWorker.on("failed", (job, err) => {
    console.error(`Job failed: ${job?.id}`, err);
});
