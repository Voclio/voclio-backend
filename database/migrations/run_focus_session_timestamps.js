import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeMigration, closeConnection } from './migrationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Running focus session timestamps migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'add_focus_session_timestamps.sql'),
      'utf8'
    );
    
    await executeMigration(migrationSQL);
    
    console.log('Focus session timestamps migration completed successfully!');
    
    await closeConnection();
  } catch (error) {
    console.error('Migration failed:', error);
    await closeConnection();
    process.exit(1);
  }
}

runMigration();