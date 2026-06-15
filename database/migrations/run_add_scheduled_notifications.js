import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeMigration, closeConnection } from './migrationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('📡 Connected to database');

    const sqlPath = path.join(__dirname, 'add_scheduled_notifications.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await executeMigration(sql);
    console.log('✅ scheduled_notifications table created successfully');

    await closeConnection();
    console.log('📡 Database connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await closeConnection();
    process.exit(1);
  }
}

runMigration();
