"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.insertOrderRecord = insertOrderRecord;
exports.updateOrderStatus = updateOrderStatus;
exports.markOrderFailed = markOrderFailed;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
exports.pool = null;
if (connectionString) {
    exports.pool = new pg_1.Pool({ connectionString });
    // ensure table exists
    (async () => {
        try {
            await exports.pool.query(`
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
        }
        catch (e) {
            console.error('Failed to ensure orders table', e);
        }
    })();
}
else {
    console.log('No DATABASE_URL provided — DB persistence disabled');
}
async function insertOrderRecord(id, type, payload) {
    if (!exports.pool)
        return;
    await exports.pool.query('INSERT INTO orders(id, type, payload, status) VALUES($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING', [id, type, payload, 'pending']);
}
async function updateOrderStatus(id, status, data) {
    if (!exports.pool)
        return;
    await exports.pool.query('UPDATE orders SET status=$2, updated_at=now(), result=$3 WHERE id=$1', [id, status, data ?? null]);
}
async function markOrderFailed(id, reason) {
    if (!exports.pool)
        return;
    await exports.pool.query('UPDATE orders SET status=$2, last_error=$3, updated_at=now() WHERE id=$1', [id, 'failed', reason]);
}
