import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export let pool: Pool | null = null;

if (connectionString) {
  pool = new Pool({ connectionString });
  // ensure table exists
  (async () => {
    try {
      await pool!.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          type TEXT,
          payload JSONB,
          status TEXT,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now(),
          last_error TEXT,
          result JSONB
        );
      `);
      console.log('🎯 orders table ensured');
    } catch (e) {
      console.error('Failed to ensure orders table', e);
    }
  })();
} else {
  console.log('No DATABASE_URL provided — DB persistence disabled');
}

export async function insertOrderRecord(id: string, type: string, payload: any) {
  if (!pool) return;
  await pool.query(
    'INSERT INTO orders(id, type, payload, status) VALUES($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',
    [id, type, payload, 'pending']
  );
}

export async function updateOrderStatus(id: string, status: string, data?: any) {
  if (!pool) return;
  await pool.query(
    'UPDATE orders SET status=$2, updated_at=now(), result=$3 WHERE id=$1',
    [id, status, data ?? null]
  );
}

export async function markOrderFailed(id: string, reason: string) {
  if (!pool) return;
  await pool.query('UPDATE orders SET status=$2, last_error=$3, updated_at=now() WHERE id=$1', [id, 'failed', reason]);
}
