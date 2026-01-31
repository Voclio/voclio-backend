import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voclio_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function fixAllTimestamps() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing all timestamp columns...\n');

    const tables = [
      'focus_sessions',
      'productivity_streaks',
      'achievements',
      'tags'
    ];

    for (const table of tables) {
      console.log(`📋 Checking ${table}...`);
      
      // Check if updated_at exists
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'updated_at'
      `, [table]);

      if (checkResult.rows.length === 0) {
        console.log(`  ➕ Adding updated_at to ${table}...`);
        await client.query(`
          ALTER TABLE ${table} 
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log(`  ✅ Added updated_at to ${table}`);
      } else {
        console.log(`  ✓ ${table} already has updated_at`);
      }

      // Make sure created_at exists too
      const checkCreated = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'created_at'
      `, [table]);

      if (checkCreated.rows.length === 0) {
        console.log(`  ➕ Adding created_at to ${table}...`);
        await client.query(`
          ALTER TABLE ${table} 
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log(`  ✅ Added created_at to ${table}`);
      }
    }

    console.log('\n✅ All timestamps fixed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllTimestamps();
