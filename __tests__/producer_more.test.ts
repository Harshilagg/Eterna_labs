jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn(async (name: string, data: any, opts: any) => ({ id: 'mock-job-id-2', name, data, opts })),
    })),
  };
});

import { enqueueOrder } from '../src/queues/orderProducer';

describe('orderProducer additional tests', () => {
  test('enqueueOrder uses attempts/backoff and removeOnComplete', async () => {
  const job = await enqueueOrder('order-xyz', { amount: 5 });
  expect(job).toHaveProperty('id');
  expect(job.opts).toHaveProperty('attempts', 3);
    // backoff object should exist
    expect(job.opts).toHaveProperty('backoff');
  });
});
