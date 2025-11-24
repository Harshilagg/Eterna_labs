"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
const fastify_1 = __importDefault(require("fastify"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const dotenv_1 = __importDefault(require("dotenv"));
const bullmq_1 = require("bullmq");
const orderProducer_1 = require("./queues/orderProducer");
const queueEvents_1 = require("./queues/queueEvents");
const db_1 = require("./config/db");
const uuid_1 = require("uuid");
const wsClients = new Set();
dotenv_1.default.config();
const PORT = Number(process.env.PORT) || 3000;
async function buildServer(desiredPort) {
    const fastify = (0, fastify_1.default)({ logger: true });
    // Register WebSocket plugin
    await fastify.register(websocket_1.default);
    // shared BullMQ queue (single instance)
    const orderQueue = new bullmq_1.Queue('order-queue', {
        connection: {
            host: process.env.REDIS_HOST ?? '127.0.0.1',
            port: +(process.env.REDIS_PORT ?? 6379),
        },
    });
    fastify.get('/jobs/:id', async (req, reply) => {
        const id = req.params.id;
        if (!id)
            return reply.status(400).send({ error: 'job id required' });
        const job = await orderQueue.getJob(id);
        if (!job)
            return reply.status(404).send({ error: 'job not found' });
        const state = await job.getState(); // waiting | active | completed | failed | delayed | paused
        const result = await job.returnvalue;
        const attempts = job.attemptsMade;
        const progress = job.progress;
        return reply.send({
            id: job.id,
            name: job.name,
            data: job.data,
            state,
            attempts,
            progress,
            result, // may be undefined until completed
        });
    });
    // Basic health route
    fastify.get("/", async () => ({ status: "Order Execution Engine Running" }));
    // POST /enqueue → push a job using your producer helper
    fastify.post('/enqueue', async (req, reply) => {
        try {
            const { orderId, payload } = req.body;
            const job = await (0, orderProducer_1.enqueueOrder)(orderId ?? `test-${Date.now()}`, payload ?? {});
            return reply.send({ ok: true, jobId: job.id });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ ok: false, error: err.message });
        }
    });
    // Main assignment endpoint: create & enqueue an order (we implement Market order - mock execution)
    fastify.post('/api/orders/execute', async (req, reply) => {
        try {
            const body = req.body;
            // minimal validation
            const orderType = (body.type || 'market').toLowerCase();
            if (orderType !== 'market') {
                // for this implementation we only support Market orders (mock). Documented in README.
                return reply.status(400).send({ error: 'only market orders supported in this implementation' });
            }
            const orderId = `order-${(0, uuid_1.v4)()}`;
            const payload = body.payload ?? { amount: body.amount ?? 1, symbol: body.symbol ?? 'TOKEN' };
            // persist minimal order record if DB configured
            await (0, db_1.insertOrderRecord)(orderId, orderType, payload).catch((e) => fastify.log.error(e));
            const job = await (0, orderProducer_1.enqueueOrder)(orderId, payload);
            const wsUrl = `ws://${process.env.HOST ?? 'localhost'}:${PORT}/ws?orderId=${orderId}`;
            return reply.send({ ok: true, orderId, jobId: job.id, wsUrl });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ ok: false, error: err.message });
        }
    });
    // Alternative route that adds directly to the queue (if you want it)
    fastify.post('/orders', async (request, reply) => {
        try {
            const { orderId, payload } = request.body;
            if (!orderId)
                return reply.status(400).send({ error: 'orderId required' });
            const job = await orderQueue.add('process-order', { orderId, payload }, {
                removeOnComplete: true,
            });
            return reply.send({ ok: true, jobId: job.id });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ ok: false, error: err.message });
        }
    });
    // WebSocket endpoint
    fastify.get("/ws", { websocket: true }, (connection, req) => {
        fastify.log.info("WebSocket client connected.");
        const socket = connection.socket;
        // track connected clients so we can broadcast queue events
        wsClients.add(socket);
        socket.send(JSON.stringify({ event: "connected", message: "WebSocket connection established" }));
        socket.on('message', (data) => {
            try {
                fastify.log.info(`Received message: ${data.toString()}`);
            }
            catch (e) {
                // ignore
            }
        });
        socket.on('close', () => {
            fastify.log.info("WebSocket disconnected.");
            wsClients.delete(socket);
        });
    });
    // Start server
    try {
        const listenOpts = { port: desiredPort ?? PORT, host: '0.0.0.0' };
        await fastify.listen(listenOpts);
        const addr = fastify.server.address();
        const actualPort = typeof addr === 'object' && addr ? addr.port : PORT;
        console.log(`🚀 Server running at http://localhost:${actualPort}`);
        console.log(`🔌 WebSocket endpoint: ws://localhost:${actualPort}/ws`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    // graceful shutdown: close queue+fastify on signals
    const shutdown = async () => {
        fastify.log.info("Shutting down server...");
        try {
            await fastify.close();
            await orderQueue.close();
        }
        catch (e) {
            fastify.log.error(e);
        }
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
// Removed misplaced buildServer call and redundant WebSocket route definition
// listen to events and broadcast
queueEvents_1.orderQueueEvents.on('completed', ({ jobId, returnvalue }) => {
    // `returnvalue` is a property on the completed job (not a Promise) so send as-is
    const msg = JSON.stringify({ event: 'job:completed', jobId, returnvalue });
    for (const s of wsClients)
        s.send(msg);
});
queueEvents_1.orderQueueEvents.on('failed', ({ jobId, failedReason }) => {
    const msg = JSON.stringify({ event: 'job:failed', jobId, failedReason });
    for (const s of wsClients)
        s.send(msg);
});
queueEvents_1.orderQueueEvents.on('waiting', ({ jobId }) => {
    const msg = JSON.stringify({ event: 'job:waiting', jobId });
    for (const s of wsClients)
        s.send(msg);
});
// broadcast progress updates (intermediate lifecycle events)
queueEvents_1.orderQueueEvents.on('progress', ({ jobId, data }) => {
    const msg = JSON.stringify({ event: 'job:progress', jobId, data });
    for (const s of wsClients)
        s.send(msg);
});
// start the server only when executed directly
if (require.main === module) {
    buildServer().catch((err) => {
        console.error('Failed to start server', err);
        process.exit(1);
    });
}
