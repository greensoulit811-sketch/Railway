import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function fixConstraints() {
  try {
    await client.connect();
    console.log('Connected to database...');

    // Drop old auth.users reference
    await client.query('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey');
    
    // Add new public.users reference
    await client.query('ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL');
    
    console.log('✅ Order table constraint fixed! Now pointing to public.users.');
  } catch (err) {
    console.error('❌ Error fixing constraints:', err.message);
  } finally {
    await client.end();
  }
}

fixConstraints();
