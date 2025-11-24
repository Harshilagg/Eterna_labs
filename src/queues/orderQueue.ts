// src/queues/orderQueue.ts
import { Queue, QueueScheduler } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: +(process.env.REDIS_PORT ?? 6379),
  // password: process.env.REDIS_PASSWORD, // uncomment if needed
};

export const orderQueue = new Queue('order-queue', { connection });
/**
 * QueueScheduler is recommended for delayed/retry jobs and cleaning locks.
 * Start one scheduler per queue (can be in same process or a separate one).
 */
export const orderQueueScheduler = new QueueScheduler('order-queue', { connection });
