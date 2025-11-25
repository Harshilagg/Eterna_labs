/**
 * Test orderProducer enqueueOrder behavior by mocking bullmq Queue
 */
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn(async (name: string, data: any, opts: any) => ({ id: 'mock-job-id', name, data, opts })),
    })),
  };
});

import { enqueueOrder } from '../src/queues/orderProducer';

describe('orderProducer', () => {
  test('enqueueOrder calls bullmq Queue.add with correct options', async () => {
  const job = await enqueueOrder('order-1', { amount: 2 });
  expect(job).toHaveProperty('id');
  expect(job).toHaveProperty('name', 'process-order');
  expect(job.data).toHaveProperty('orderId', 'order-1');
  expect(job.opts).toHaveProperty('attempts', 3);
  });

  test('enqueueOrder uses provided payload when present', async () => {
    const job = await enqueueOrder('order-2', { amount: 5, foo: 'bar' });
    expect(job.data.orderId).toBe('order-2');
    expect(job.data.payload).toEqual({ amount: 5, foo: 'bar' });
  });
});
