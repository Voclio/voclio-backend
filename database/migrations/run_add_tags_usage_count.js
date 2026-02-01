import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: add_tags_usage_count...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'add_tags_usage_count.sql'),
      'utf8'
    );
    
    await client.query(migrationSQL);
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ Added usage_count column to tags table');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
