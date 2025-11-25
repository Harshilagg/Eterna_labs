import { Queue, Worker, QueueScheduler } from "bullmq";
import { getRedis } from "./redis";

let _orderQueue: any = null;
let _orderQueueScheduler: any = null;
let _orderWorker: any = null;

export function getOrderQueue() {
  if (_orderQueue) return _orderQueue;
  if (process.env.NODE_ENV === 'test') {
    _orderQueue = {
      add: async (name: string, data: any, opts: any) => ({ id: `test-${Date.now()}`, name, data, opts }),
      close: async () => {},
      getJob: async (id: string) => null,
    };
  } else {
    _orderQueue = new Queue('order-queue', { connection: getRedis() });
  }
  return _orderQueue;
}

export function getOrderQueueScheduler() {
  if (_orderQueueScheduler) return _orderQueueScheduler;
  if (process.env.NODE_ENV === 'test') {
    _orderQueueScheduler = { close: async () => {} };
  } else {
    _orderQueueScheduler = new QueueScheduler('order-queue', { connection: getRedis() });
  }
  return _orderQueueScheduler;
}

export function getOrderWorker(processor?: (job: any) => Promise<any>) {
  if (_orderWorker) return _orderWorker;
  if (process.env.NODE_ENV === 'test') {
    _orderWorker = {
      on: (_ev: string, _cb: Function) => {},
      close: async () => {},
    };
  } else {
    _orderWorker = new Worker('order-queue', processor ?? (async (job) => {
      console.log(`Processing order job: ${job.id}`);
      const orderData = job.data;
      return {
        status: 'processed',
        processedAt: new Date().toISOString(),
        originalOrder: orderData,
      };
    }), { connection: getRedis() });

    _orderWorker.on('completed', (job: any) => {
      console.log(`Job completed: ${job.id}`);
    });

    _orderWorker.on('failed', (job: any, err: any) => {
      console.error(`Job failed: ${job?.id}`, err);
    });
  }
  return _orderWorker;
}
