import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: +(process.env.REDIS_PORT ?? 6379),
};

export const orderQueue = new Queue('order-queue', { connection });

export async function enqueueOrder(orderId: string, payload?: any) {
  const job = await orderQueue.add('process-order', { orderId, payload }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
  });
  return job;
}
