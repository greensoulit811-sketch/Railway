import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Use DATABASE_URL from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not defined in .env');
  process.exit(1);
}

const runMigration = async () => {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for some hosted providers like Railway
    }
  });

  try {
    console.log('Connecting to Railway database...');
    await client.connect();
    console.log('Connected successfully.');

    const migrationFiles = [
      '../supabase/migrations/railway_setup.sql',
      '../supabase/migrations/combined_migrations.sql',
      '../supabase/migrations/standard_users.sql'
    ];

    for (const file of migrationFiles) {
      console.log(`Executing ${file}...`);
      const sqlPath = path.resolve(__dirname, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Execute the SQL
      await client.query(sql);
      console.log(`Finished ${file}.`);
    }

    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
};

runMigration();
