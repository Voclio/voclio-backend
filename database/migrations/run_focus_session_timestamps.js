import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Running focus session timestamps migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'add_focus_session_timestamps.sql'),
      'utf8'
    );
    
    await pool.query(migrationSQL);
    
    console.log('Focus session timestamps migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();