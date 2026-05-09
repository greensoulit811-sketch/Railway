import { query } from '../server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkProducts() {
  try {
    const res = await query('SELECT id, name, price, created_at FROM public.products ORDER BY created_at DESC');
    console.log('Total Products:', res.rows.length);
    console.log('Products:', JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkProducts();
