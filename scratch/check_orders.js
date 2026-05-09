import { query } from '../server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkLogs() {
  try {
    // Check if we have any purchase events in the orders table recently
    const res = await query('SELECT order_number, total, created_at FROM public.orders ORDER BY created_at DESC LIMIT 5');
    console.log('Recent Orders:', JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkLogs();
