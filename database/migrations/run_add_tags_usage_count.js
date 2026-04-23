import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeMigration, closeConnection } from './migrationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Starting migration: add_tags_usage_count...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'add_tags_usage_count.sql'),
      'utf8'
    );
    
    await executeMigration(migrationSQL);
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ Added usage_count column to tags table');
    
    await closeConnection();
  } catch (error) {
    console.error('Migration failed:', error.message);
    await closeConnection();
    throw error;
  }
}

runMigration().catch(console.error);
