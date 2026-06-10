import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeMigration, closeConnection } from './migrationHelper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sql = fs.readFileSync(path.join(__dirname, 'fix_webex_sync_columns.sql'), 'utf8');

executeMigration(sql)
  .then(() => {
    console.log('✅ Webex sync column migration completed');
    return closeConnection();
  })
  .catch(err => {
    console.error('❌ Webex sync column migration failed:', err.message);
    process.exit(1);
  });
