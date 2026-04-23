import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeMigration, closeConnection } from './migrationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add voice_recording_id to tasks...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add_voice_recording_to_tasks.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the migration
    console.log('📝 Executing SQL migration...');
    await executeMigration(sql);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Added voice_recording_id column to tasks table');
    console.log('✅ Added foreign key constraint');
    console.log('✅ Added index for performance');
    
    await closeConnection();
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    await closeConnection();
    process.exit(1);
  }
}

runMigration();
