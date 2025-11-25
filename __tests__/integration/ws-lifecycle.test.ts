// Integration tests require a running Redis instance. Skip by default to avoid
// opening real Redis connections during the unit test run. To run these,
// set RUN_INTEGRATION=1 in the environment.
const runIntegration = process.env.RUN_INTEGRATION === '1';

(runIntegration ? describe : describe.skip)('websocket lifecycle integration (requires Redis)', () => {
  jest.setTimeout(30000);
  let server: any;

  beforeAll(async () => {
    // Delay imports so that when integration tests are skipped we don't import modules
    // that create real Redis/BullMQ connections at module import time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { buildServer } = require('../../src/server');
    server = await buildServer(4001);
  });

  afterAll(async () => {
    if (server) await server.close();
  });

  test('enqueue order and receive progress via ws', (done) => {
    // connect ws client
    // lazy require heavy modules
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WebSocket = require('ws');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { enqueueOrder } = require('../../src/queues/orderProducer');

    const ws = new WebSocket('ws://localhost:4001/ws');
    ws.on('open', async () => {
      // enqueue a job via producer helper
      const job = await enqueueOrder(`itest-${Date.now()}`, { amount: 1 });
      let seenRouting = false;
      let seenConfirmed = false;

  ws.on('message', (m: any) => {
        try {
          const parsed = JSON.parse(m.toString());
          if (parsed.event === 'job:progress') {
            const data = parsed.data as any;
            if (data.status === 'routing') seenRouting = true;
            if (data.status === 'confirmed') seenConfirmed = true;
          }
          if (seenRouting && seenConfirmed) {
            ws.close();
            done();
          }
        } catch (e) {
          // ignore
        }
      });
    });
  });
});
