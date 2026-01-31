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

async function fixUserSettingsEnum() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing user_settings theme ENUM...\n');

    // Step 1: Check if ENUM type exists
    console.log('1️⃣ Checking ENUM type...');
    const enumCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'enum_user_settings_theme'
      ) as exists
    `);

    if (!enumCheck.rows[0].exists) {
      console.log('  Creating ENUM type...');
      await client.query(`
        CREATE TYPE enum_user_settings_theme AS ENUM ('light', 'dark', 'auto')
      `);
      console.log('  ✅ ENUM type created');
    } else {
      console.log('  ✓ ENUM type already exists');
    }

    // Step 2: Drop default temporarily
    console.log('\n2️⃣ Dropping default value...');
    await client.query(`
      ALTER TABLE user_settings 
      ALTER COLUMN theme DROP DEFAULT
    `);
    console.log('  ✅ Default dropped');

    // Step 3: Convert column to ENUM
    console.log('\n3️⃣ Converting column to ENUM...');
    await client.query(`
      ALTER TABLE user_settings 
      ALTER COLUMN theme TYPE enum_user_settings_theme 
      USING theme::enum_user_settings_theme
    `);
    console.log('  ✅ Column converted');

    // Step 4: Set default back
    console.log('\n4️⃣ Setting default value...');
    await client.query(`
      ALTER TABLE user_settings 
      ALTER COLUMN theme SET DEFAULT 'auto'::enum_user_settings_theme
    `);
    console.log('  ✅ Default set');

    // Step 5: Update any NULL values
    console.log('\n5️⃣ Updating NULL values...');
    const updateResult = await client.query(`
      UPDATE user_settings 
      SET theme = 'auto'::enum_user_settings_theme 
      WHERE theme IS NULL
    `);
    console.log(`  ✅ Updated ${updateResult.rowCount} rows`);

    console.log('\n✅ UserSettings ENUM fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixUserSettingsEnum();
