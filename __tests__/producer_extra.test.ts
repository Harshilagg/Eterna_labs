import { enqueueOrder } from '../src/queues/orderProducer';

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(async (name: string, data: any, opts: any) => ({ id: 'mock-job', name, data, opts })),
  })),
}));

describe('producer defaults', () => {
  test('enqueueOrder sets default payload when none provided', async () => {
    const job = await enqueueOrder('order-x');
    expect(job).toHaveProperty('id');
    expect(job.data).toHaveProperty('orderId', 'order-x');
    expect(job.data).toHaveProperty('payload');
  });
});
