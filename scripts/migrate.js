#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it and re-run migrations.');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
    console.log('Running migration:', f);
    try {
      await client.query(sql);
    } catch (e) {
      console.error('Migration failed:', f, e);
      await client.end();
      process.exit(1);
    }
  }
  await client.end();
  console.log('Migrations complete');
})();
