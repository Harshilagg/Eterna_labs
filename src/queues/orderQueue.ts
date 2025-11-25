// src/queues/orderQueue.ts
import { Queue, QueueScheduler } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: +(process.env.REDIS_PORT ?? 6379),
  // password: process.env.REDIS_PASSWORD, // uncomment if needed
};

let _queue: any = null;
let _scheduler: any = null;

export function getOrderQueue() {
  if (_queue) return _queue;
  if (process.env.NODE_ENV === 'test') {
    // If tests created a jest mock for 'bullmq', prefer using that mocked Queue implementation
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bullmq = require('bullmq');
      if (bullmq && typeof bullmq.Queue === 'function' && (bullmq.Queue as any)._isMockFunction) {
        _queue = new bullmq.Queue('order-queue', { connection });
      } else {
        // default in-memory stub
        _queue = {
          add: async (name: string, data: any, opts: any) => ({ id: `test-${Date.now()}`, name, data, opts }),
          close: async () => {},
          getJob: async (id: string) => null,
        };
      }
    } catch (e) {
      _queue = {
        add: async (name: string, data: any, opts: any) => ({ id: `test-${Date.now()}`, name, data, opts }),
        close: async () => {},
        getJob: async (id: string) => null,
      };
    }
  } else {
    _queue = new Queue('order-queue', { connection });
  }
  return _queue;
}

export function getOrderQueueScheduler() {
  if (_scheduler) return _scheduler;
  if (process.env.NODE_ENV === 'test') {
    _scheduler = { close: async () => {} };
  } else {
    _scheduler = new QueueScheduler('order-queue', { connection });
  }
  return _scheduler;
}

export const orderQueue = getOrderQueue();
export const orderQueueScheduler = getOrderQueueScheduler();
