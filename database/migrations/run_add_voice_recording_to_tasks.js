import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voclio',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration: Add voice_recording_id to tasks...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add_voice_recording_to_tasks.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the migration
    await client.query('BEGIN');
    
    console.log('📝 Executing SQL migration...');
    await client.query(sql);
    
    await client.query('COMMIT');
    
    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Added voice_recording_id column to tasks table');
    console.log('✅ Added foreign key constraint');
    console.log('✅ Added index for performance');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
