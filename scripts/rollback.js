#!/usr/bin/env node
const { Client } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it and re-run rollback.');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query('DROP TABLE IF EXISTS orders');
    console.log('Dropped orders table');
  } catch (e) {
    console.error('Rollback failed', e);
  }
  await client.end();
})();
