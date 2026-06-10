import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeMigration, closeConnection } from './migrationHelper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, 'fix_task_status_todo.sql'), 'utf8');

executeMigration(sql)
  .then(() => {
    console.log('✅ Task status migration completed');
    return closeConnection();
  })
  .catch(err => {
    console.error('❌ Task status migration failed:', err.message);
    process.exit(1);
  });
