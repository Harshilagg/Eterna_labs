import { buildServer } from '../../src/server';
import WebSocket from 'ws';
import { enqueueOrder } from '../../src/queues/orderProducer';
import { orderQueue } from '../../src/queues/orderQueue';

describe('websocket lifecycle integration (requires Redis)', () => {
  jest.setTimeout(30000);
  let server: any;

  beforeAll(async () => {
    server = await buildServer(4001);
  });

  afterAll(async () => {
    if (server) await server.close();
  });

  test('enqueue order and receive progress via ws', (done) => {
    // connect ws client
    const ws = new WebSocket('ws://localhost:4001/ws');
    ws.on('open', async () => {
      // enqueue a job via producer helper
      const job = await enqueueOrder(`itest-${Date.now()}`, { amount: 1 });
      let seenRouting = false;
      let seenConfirmed = false;

      ws.on('message', (m) => {
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
