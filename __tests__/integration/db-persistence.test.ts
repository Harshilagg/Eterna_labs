// Requires RUN_INTEGRATION=1 and DATABASE_URL to be set.
const runDbIntegration = process.env.RUN_INTEGRATION === '1' && !!process.env.DATABASE_URL;

(runDbIntegration ? describe : describe.skip)('DB persistence integration (requires Postgres)', () => {
  jest.setTimeout(30000);
  let server: any;
  let worker: any;
  const DB = require('pg');

  beforeAll(async () => {
    // run migrations
    const child = require('child_process');
    child.execSync('node scripts/migrate.js', { stdio: 'inherit', env: process.env });

    // start server
    const { buildServer } = require('../../src/server');
    server = await buildServer(0);

    // start worker
    const wk = require('../../src/workers/orderWorker');
    worker = await wk.startWorker();
  });

  afterAll(async () => {
    try {
      if (worker && typeof worker.close === 'function') await worker.close();
    } catch (e) {}
    if (server) await server.close();
  });

  test('enqueued order is persisted and status updated by worker', async () => {
    const { enqueueOrder } = require('../../src/queues/orderProducer');
    const orderId = `itest-${Date.now()}`;
    await enqueueOrder(orderId, { amount: 1 });

    // poll DB for status -> confirmed
    const client = new DB.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const deadline = Date.now() + 20000;
    let row = null;
    while (Date.now() < deadline) {
      const res = await client.query('SELECT status, result FROM orders WHERE id = $1', [orderId]);
      if (res.rows.length) {
        row = res.rows[0];
        if (row.status === 'confirmed' || row.status === 'failed') break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    await client.end();

    expect(row).not.toBeNull();
    expect(['confirmed', 'failed']).toContain(row.status);
  });
});
