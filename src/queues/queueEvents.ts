// src/queues/queueEvents.ts
import { QueueEvents } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: +(process.env.REDIS_PORT ?? 6379),
};

let _events: any = null;
export function getOrderQueueEvents() {
  if (_events) return _events;
  if (process.env.NODE_ENV === 'test') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bullmq = require('bullmq');
      if (bullmq && typeof bullmq.QueueEvents === 'function' && (bullmq.QueueEvents as any)._isMockFunction) {
        _events = new bullmq.QueueEvents('order-queue', { connection });
      } else {
        _events = {
          on: (_: string, __: (...args: any[]) => void) => {},
          close: async () => {},
        };
      }
    } catch (e) {
      _events = {
        on: (_: string, __: (...args: any[]) => void) => {},
        close: async () => {},
      };
    }
  } else {
    _events = new QueueEvents('order-queue', { connection });
  }
  return _events;
}

export const orderQueueEvents = getOrderQueueEvents();
