import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voclio_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Running categories table migration...');
    
    const migrationSQL = readFileSync(
      join(__dirname, 'fix_categories_table.sql'),
      'utf8'
    );
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Added updated_at column to categories table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
