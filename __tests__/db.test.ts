import { insertOrderRecord, updateOrderStatus, markOrderFailed } from '../src/config/db';

describe('db helpers (no DATABASE_URL)', () => {
  test('insert/update/markFailed do not throw when no DB configured', async () => {
    await expect(insertOrderRecord('x', 'market', { a: 1 })).resolves.toBeUndefined();
    await expect(updateOrderStatus('x', 'routing', { foo: 'bar' })).resolves.toBeUndefined();
    await expect(markOrderFailed('x', 'reason')).resolves.toBeUndefined();
  });
});
