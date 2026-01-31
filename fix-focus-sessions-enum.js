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

async function fixFocusSessionsEnum() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing focus_sessions status ENUM...\n');

    // Step 1: Check if ENUM type exists
    console.log('1️⃣ Checking ENUM type...');
    const enumCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'enum_focus_sessions_status'
      ) as exists
    `);

    if (!enumCheck.rows[0].exists) {
      console.log('  Creating ENUM type...');
      await client.query(`
        CREATE TYPE enum_focus_sessions_status AS ENUM ('active', 'paused', 'completed', 'cancelled')
      `);
      console.log('  ✅ ENUM type created');
    } else {
      console.log('  ✓ ENUM type already exists');
    }

    // Step 2: Drop default temporarily
    console.log('\n2️⃣ Dropping default value...');
    await client.query(`
      ALTER TABLE focus_sessions 
      ALTER COLUMN status DROP DEFAULT
    `);
    console.log('  ✅ Default dropped');

    // Step 3: Convert column to ENUM
    console.log('\n3️⃣ Converting column to ENUM...');
    await client.query(`
      ALTER TABLE focus_sessions 
      ALTER COLUMN status TYPE enum_focus_sessions_status 
      USING status::enum_focus_sessions_status
    `);
    console.log('  ✅ Column converted');

    // Step 4: Set default back
    console.log('\n4️⃣ Setting default value...');
    await client.query(`
      ALTER TABLE focus_sessions 
      ALTER COLUMN status SET DEFAULT 'active'::enum_focus_sessions_status
    `);
    console.log('  ✅ Default set');

    // Step 5: Update any NULL values
    console.log('\n5️⃣ Updating NULL values...');
    const updateResult = await client.query(`
      UPDATE focus_sessions 
      SET status = 'active'::enum_focus_sessions_status 
      WHERE status IS NULL
    `);
    console.log(`  ✅ Updated ${updateResult.rowCount} rows`);

    console.log('\n✅ FocusSession ENUM fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixFocusSessionsEnum();
