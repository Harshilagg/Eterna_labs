# Order Execution Engine

Minimal Order Execution Engine using Fastify + BullMQ + Redis.

Prerequisites
- Node 18+ (or compatible)
- Redis running locally (or configure via environment variables)

Quick start (macOS / zsh)

1. Install dependencies

```bash
npm install
```

2. Start Redis (recommended via Docker)

```bash
docker run --rm -p 6379:6379 redis:7
```

3. Start the server (dev)

```bash
npm run dev
```

4. Start a worker (in a separate terminal)

```bash
npm run worker
```

5. Enqueue a job (test)

```bash
curl -X POST http://localhost:3000/enqueue \
  -H "Content-Type: application/json" \
  -d '{"orderId":"order-123","payload":{"foo":"bar"}}'
```

6. WebSocket

Connect to ws://localhost:3000/ws to receive job events (waiting/completed/failed).

Environment variables
- `PORT` - server port (default 3000)
- `REDIS_HOST` - redis host (default 127.0.0.1)
- `REDIS_PORT` - redis port (default 6379)

Notes
- This repo already contains a simple `orderWorker` and producer helper. I fixed the server to track WS clients and start the Fastify server.
- Next steps I can take on request: add tests, consolidate Redis connection modules, or wire a Postgres persistence layer (there is a `pg` dependency already present).

Design choices for the assignment
- Chosen order type: Market Order. Reason: Market orders emphasize routing and immediate execution flow which is the core of the assignment (compare DEX quotes, pick best venue, execute). Implementing Market order allows clear demonstration of routing, retries, queue management and real-time lifecycle events. Limit and Sniper orders can be added by adding price-watchers and event triggers on top of the same routing/worker architecture.

How to use the assignment endpoint
- POST /api/orders/execute accepts a JSON body with optional fields `type` (defaults to `market`), `amount`, and `symbol`.
- The endpoint returns `{ orderId, jobId, wsUrl }`. Connect to the returned `wsUrl` (or the global `ws://host:port/ws`) to receive lifecycle events for all jobs. The WebSocket emits events:
  - `job:progress` — intermediate progress objects (routing, building, submitted, confirmed, failed)
  - `job:completed` — final result
  - `job:failed` — failure

Note on HTTP→WebSocket semantics
The assignment requests upgrading the same HTTP connection to WebSocket; in practice WebSocket handshakes are performed via GET upgrade requests. This implementation uses a POST to create/enqueue the order and returns a `wsUrl` to connect for live updates. This is a pragmatic and common pattern when clients (browsers) submit with POST and then open a WebSocket for live updates. If you want a strict single-connection upgrade flow, we can implement that via a custom client that issues the WebSocket upgrade with the order payload in the query or subprotocol — tell me and I will implement it.

Next steps I can take now (pick one):
- Add integration tests that enqueue jobs and assert websocket messages via a headless WS client (requires Redis running)
- Consolidate connection modules so Redis/Postgres usage is centralized
- Add a Postgres-backed test that verifies order persistence (requires DATABASE_URL)
