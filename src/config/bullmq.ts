import { Queue, Worker, QueueScheduler } from "bullmq";
import { redis } from "./redis";
import path from "path";

export const orderQueue = new Queue("order-queue", {
  connection: redis,
});

// Prevent stalled jobs
new QueueScheduler("order-queue", {
  connection: redis,
});

// Worker to process orders
export const orderWorker = new Worker(
  "order-queue",
  async (job) => {
    console.log(`Processing order job: ${job.id}`);
    const orderData = job.data;

    // Simulate processing (later replaced with real logic)
    return {
      status: "processed",
      processedAt: new Date().toISOString(),
      originalOrder: orderData,
    };
  },
  {
    connection: redis,
  }
);

orderWorker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

orderWorker.on("failed", (job, err) => {
  console.error(`Job failed: ${job?.id}`, err);
});
