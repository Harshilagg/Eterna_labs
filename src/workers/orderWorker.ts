// src/workers/orderWorker.ts
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { orderQueueScheduler } from '../queues/orderQueue';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: +(process.env.REDIS_PORT ?? 6379),
  // password: process.env.REDIS_PASSWORD,
};

// create/ensure scheduler is running (imported above)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const scheduler = orderQueueScheduler;

const worker = new Worker(
  'order-queue',
  async (job: Job) => {
    // minimal processing logic
    console.log(`[worker] processing job ${job.id} name=${job.name}`);
    const { orderId, payload } = job.data as { orderId: string; payload?: any };

    // place your real order-processing logic here:
    // e.g. call external service, save to DB, push to other queues, etc.
    await fakeProcessOrder(orderId, payload);

    return { ok: true, processedAt: new Date().toISOString() };
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`[worker] job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err);
});

async function fakeProcessOrder(orderId: string, payload: any) {
  // just a placeholder — replace with real logic
  console.log(`[worker] fake processing order ${orderId}`, payload);
  await new Promise((r) => setTimeout(r, 500)); // simulate async work
}

// graceful shutdown
const shutDown = async () => {
  console.log('[worker] shutting down');
  await worker.close(); // stops taking new jobs and waits for active ones
  // queue scheduler should be closed if you started it in this process:
  await scheduler.close();
  process.exit(0);
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
