// src/workers/orderWorker.ts
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { orderQueueScheduler } from '../queues/orderQueue';
import { getRaydiumQuote, getMeteoraQuote, chooseBestQuote } from '../dex/mockDex';
import { v4 as uuidv4 } from 'uuid';
import { updateOrderStatus, markOrderFailed } from '../config/db';

let _worker: any = null;

// processor function implementing the lifecycle for a job
async function processor(job: Job) {
  console.log(`[worker] processing job ${job.id} name=${job.name}`);
  const { orderId, payload } = job.data as { orderId: string; payload?: any };

  try {
    // pending -> routing
    await job.updateProgress({ status: 'routing' });
    await updateOrderStatus(orderId, 'routing');

    // fetch quotes in parallel
    const [r, m] = await Promise.all([getRaydiumQuote(payload?.amount ?? 1), getMeteoraQuote(payload?.amount ?? 1)]);
    const chosen = chooseBestQuote(r, m);

    await job.updateProgress({ status: 'building', chosen });
    await updateOrderStatus(orderId, 'building');

    // simulate building transaction
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 700));

    // simulate submit
    const txHash = `0x${uuidv4().replace(/-/g, '').slice(0, 40)}`;
    await job.updateProgress({ status: 'submitted', txHash, chosen });
    await updateOrderStatus(orderId, 'submitted');

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
    await updateOrderStatus(orderId, 'confirmed', result);

    return result;
  } catch (err: any) {
    console.error('[worker] job failed', job.id, err);
    await job.updateProgress({ status: 'failed', reason: err?.message ?? String(err) });
    await markOrderFailed(orderId, err?.message ?? String(err));
    throw err;
  }
}

export async function startWorker() {
  if (_worker) return _worker;

  const connection = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: +(process.env.REDIS_PORT ?? 6379),
  };
  console.log('[worker] starting — connecting to Redis at', connection);

  // ensure scheduler is referenced
  const scheduler = orderQueueScheduler;

  _worker = new Worker('order-queue', processor, { connection, concurrency: 10 });

  _worker.on('completed', (job: any) => {
    console.log(`[worker] job ${job.id} completed`);
  });

  _worker.on('failed', (job: any, err: any) => {
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
