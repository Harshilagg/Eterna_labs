jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    getJob: async (id: string) => {
      if (id === 'exists') {
        return {
          id: 'exists',
          name: 'process-order',
          data: { orderId: 'exists', payload: { a: 1 } },
          getState: async () => 'completed',
          returnvalue: { status: 'ok' },
          attemptsMade: 1,
          progress: { status: 'confirmed' },
        };
      }
      return null;
    },
  })),
}));

import { buildServer } from '../src/server';

describe('/jobs/:id endpoint', () => {
  let fastify: any;
  beforeAll(async () => {
    fastify = await buildServer(0);
  });
  afterAll(async () => {
    if (fastify) await fastify.close();
  });

  test('returns 404 when job not found', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/jobs/notfound' });
    expect(res.statusCode).toBe(404);
  });

  test('returns job details when job exists', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/jobs/exists' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('id', 'exists');
    expect(body).toHaveProperty('state', 'completed');
    expect(body).toHaveProperty('result');
  });
});
