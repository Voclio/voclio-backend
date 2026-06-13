import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voclio_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'add_google_event_id_to_tasks.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration: Add google_event_id to tasks table...');
    await pool.query(sql);
    console.log('Migration completed successfully.');
  } catch (error) {
    if (error.code === '42701') {
      console.log('Column google_event_id already exists. Skipping.');
    } else {
      console.error('Error running migration:', error);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
