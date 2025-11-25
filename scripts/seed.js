#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it and re-run seed.');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const file = path.join(migrationsDir, '002_seed_orders.sql');
  if (!fs.existsSync(file)) {
    console.error('Seed file missing:', file);
    await client.end();
    process.exit(1);
  }
  const sql = fs.readFileSync(file, 'utf8');
  try {
    await client.query(sql);
    console.log('Seed applied');
  } catch (e) {
    console.error('Seed failed', e);
  }
  await client.end();
})();
