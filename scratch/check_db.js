import { query } from '../server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const res = await query('SELECT * FROM public.site_settings');
    console.log('Rows:', res.rows.length);
    console.log('Data:', JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
