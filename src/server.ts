import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import dotenv from "dotenv";

dotenv.config();

import { Queue } from 'bullmq';

const fastify = Fastify({
  logger: true,
});

const orderQueue = new Queue('order-queue', {
  connection: {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: +(process.env.REDIS_PORT ?? 6379),
  },
});

fastify.post('/orders', async (request, reply) => {
  const { orderId, payload } = request.body as { orderId?: string; payload?: any };
  if (!orderId) return reply.status(400).send({ error: 'orderId required' });

  const job = await orderQueue.add('process-order', { orderId, payload }, {
    removeOnComplete: true,
  });

  return reply.send({ ok: true, jobId: job.id });
});

const PORT = Number(process.env.PORT) || 3000;

async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  // Register WebSocket Plugin
  fastify.register(websocketPlugin);

  // Basic test route
  fastify.get("/", async () => {
    return { status: "Order Execution Engine Running" };
  });

  // WebSocket endpoint (will expand later)
  fastify.get("/ws", { websocket: true }, (connection, req) => {
    console.log("WebSocket client connected.");

    connection.socket.send(
      JSON.stringify({
        event: "connected",
        message: "WebSocket connection established",
      })
    );

    connection.socket.on("message", (msg: string | Buffer) => {
      console.log("Received message:", msg.toString());
    });

    connection.socket.on("close", () => {
      console.log("WebSocket disconnected.");
    });
  });

  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

buildServer();
