// Simple WS client to listen for job events
const WebSocket = require('ws');
const url = process.argv[2] || 'ws://localhost:3001/ws';
console.log('Connecting to', url);
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('WS connected');
});

ws.on('message', (m) => {
  try {
    const s = m.toString();
    console.log('WS MSG:', s);
  } catch (e) {
    console.log('WS RAW:', m);
  }
});

ws.on('close', () => console.log('WS closed'));
ws.on('error', (e) => console.error('WS error', e && e.message ? e.message : e));
