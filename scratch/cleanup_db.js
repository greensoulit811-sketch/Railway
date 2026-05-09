import { query } from '../server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function cleanupAndFix() {
  try {
    console.log('--- Cleaning up site_settings ---');
    // Delete any rows that are NOT 'global'
    await query("DELETE FROM public.site_settings WHERE id != 'global'");
    
    // Ensure 'global' row exists
    const check = await query("SELECT id FROM public.site_settings WHERE id = 'global'");
    if (check.rows.length === 0) {
      console.log('Inserting default global row...');
      await query("INSERT INTO public.site_settings (id, language) VALUES ('global', 'en')");
    }
    
    console.log('Cleanup Successful!');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}
cleanupAndFix();
