import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { executeMigration, closeConnection } from './migrationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔧 Running categories table migration...');

    const migrationSQL = readFileSync(join(__dirname, 'fix_categories_table.sql'), 'utf8');

    await executeMigration(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('✅ Added updated_at column to categories table');

    await closeConnection();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await closeConnection();
    throw error;
  }
}

runMigration().catch(console.error);
