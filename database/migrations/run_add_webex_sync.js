import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../../src/config/database.orm.js';
import { executeMigration, closeConnection } from './migrationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runWebexSyncMigration() {
  try {
    console.log('🔗 Connected to database');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'add_webex_sync.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running Webex sync migration...');
    
    // Execute the migration
    await executeMigration(migrationSQL);
    
    console.log('✅ Webex sync migration completed successfully!');
    
    // Verify the table was created
    const [result] = await sequelize.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'webex_sync'
      ORDER BY ordinal_position;
    `);
    
    if (result.length > 0) {
      console.log('\n📋 Webex sync table structure:');
      result.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

    // Check indexes
    const [indexResult] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'webex_sync';
    `);
    
    if (indexResult.length > 0) {
      console.log('\n🔍 Created indexes:');
      indexResult.forEach(row => {
        console.log(`  - ${row.indexname}`);
      });
    }

    await closeConnection();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    await closeConnection();
    process.exit(1);
  }
}

// Run the migration
runWebexSyncMigration();