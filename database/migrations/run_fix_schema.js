import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔧 Running schema fix migration...\n');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix_schema_issues.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ Schema fixes applied successfully!\n');
    console.log('Fixed issues:');
    console.log('  - Added is_dismissed column to reminders table');
    console.log('  - Added start_time and end_time columns to focus_sessions table');
    console.log('  - Added streak_date column to productivity_streaks table');
    console.log('  - Added unique constraint on (user_id, streak_date)');
    console.log('  - Added title column to achievements table');
    console.log('  - Created performance indexes\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
