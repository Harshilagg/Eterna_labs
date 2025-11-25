// Mock bullmq to avoid real Redis connections during tests (prevents open handles)
jest.mock('bullmq', () => {
  class DummyQueue {
    constructor() {}
    async add(name: string, data: any, opts: any) {
      return { id: 'mock-job-id', name, data, opts };
    }
    async getJob(id: string) {
      return null;
    }
    async close() {}
  }

  class DummyQueueEvents {
    constructor() {}
    on() {}
    close() {}
  }

  return {
    Queue: DummyQueue,
    QueueEvents: DummyQueueEvents,
    QueueScheduler: class {
      constructor() {}
      async close() {}
    },
  };
});

jest.mock('../src/queues/orderProducer', () => ({
  enqueueOrder: jest.fn(async (orderId: string, payload: any) => ({ id: `job-${orderId}` })),
}));

import { buildServer } from '../src/server';

describe('server /api/orders/execute', () => {
  let fastify: any;
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    fastify = await buildServer(0); // ephemeral port
  });
  afterAll(async () => {
    if (fastify) await fastify.close();
  });

  test('returns 400 for unsupported order types', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: { type: 'limit', amount: 1 },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('error');
  });

  test('accepts market order and returns orderId and jobId', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: { type: 'market', amount: 1 },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('orderId');
    expect(body).toHaveProperty('jobId');
    expect(body).toHaveProperty('wsUrl');
  });
});
