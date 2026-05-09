import { query } from '../server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function debugSettings() {
  try {
    console.log('--- Checking Current Settings ---');
    const current = await query("SELECT * FROM public.site_settings WHERE id = 'global'");
    console.log('Current Data:', JSON.stringify(current.rows, null, 2));

    console.log('\n--- Attempting Manual Update ---');
    const testId = '123456789012345';
    const update = await query(`
      UPDATE public.site_settings 
      SET fb_pixel_id = $1, fb_pixel_enabled = true 
      WHERE id = 'global' 
      RETURNING *
    `, [testId]);
    
    if (update.rows.length > 0) {
      console.log('Update Success! New ID:', update.rows[0].fb_pixel_id);
    } else {
      console.log('Update Failed: Row not found or not updated');
    }

    process.exit(0);
  } catch (err) {
    console.error('DATABASE ERROR:', err.message);
    process.exit(1);
  }
}
debugSettings();
