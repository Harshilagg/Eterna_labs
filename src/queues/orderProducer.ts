import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: +(process.env.REDIS_PORT ?? 6379),
};

// Avoid creating real Redis/BullMQ connections while running tests to prevent
// open handles that keep Jest alive. Use a simple in-memory stub in test mode.
let _orderQueue: any = null;
function getOrderQueue() {
  if (_orderQueue) return _orderQueue;
  if (process.env.NODE_ENV === 'test') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bullmq = require('bullmq');
      if (bullmq && typeof bullmq.Queue === 'function' && (bullmq.Queue as any)._isMockFunction) {
        _orderQueue = new bullmq.Queue('order-queue', { connection });
      } else {
        _orderQueue = {
          add: async (name: string, data: any, opts: any) => ({ id: `test-${Date.now()}`, name, data, opts }),
          getJob: async (id: string) => null,
          close: async () => {},
        };
      }
    } catch (e) {
      _orderQueue = {
        add: async (name: string, data: any, opts: any) => ({ id: `test-${Date.now()}`, name, data, opts }),
        getJob: async (id: string) => null,
        close: async () => {},
      };
    }
  } else {
    _orderQueue = new Queue('order-queue', { connection });
  }
  return _orderQueue;
}

export async function enqueueOrder(orderId: string, payload?: any) {
  const orderQueue = getOrderQueue();
  const job = await orderQueue.add('process-order', { orderId, payload }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
  });
  return job;
}

// expose a helper for tests/tools that may want to access the queue instance
export const orderQueue = (() => getOrderQueue())();
