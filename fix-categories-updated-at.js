import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voclio_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function fix() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing categories updated_at column...');
    
    await client.query('ALTER TABLE categories ALTER COLUMN updated_at DROP NOT NULL');
    console.log('✅ Removed NOT NULL constraint');
    
    await client.query('ALTER TABLE categories ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Set default value');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
