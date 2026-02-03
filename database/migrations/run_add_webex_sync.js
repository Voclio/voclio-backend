import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voclio_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

async function runWebexSyncMigration() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'add_webex_sync.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running Webex sync migration...');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Webex sync migration completed successfully!');
    
    // Verify the table was created
    const result = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'webex_sync'
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Webex sync table structure:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'webex_sync';
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('\n🔍 Created indexes:');
      indexResult.rows.forEach(row => {
        console.log(`  - ${row.indexname}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runWebexSyncMigration();