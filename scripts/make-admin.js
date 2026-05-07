import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function makeAdmin() {
  try {
    await client.connect();
    const email = 'greensoulit811@gmail.com';
    
    // 1. Find user
    const res = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      console.log('User not found!');
      return;
    }
    
    const userId = res.rows[0].id;
    
    // 2. Assign admin role (Try both column names for safety)
    try {
      await client.query('INSERT INTO user_roles (public_user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, 'admin']);
    } catch (e) {
      await client.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, 'admin']);
    }
    
    console.log('SUCCESS: You are now an admin!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

makeAdmin();
