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

async function fixEnum(client, tableName, columnName, enumTypeName, enumValues, defaultValue) {
  console.log(`\n🔧 Fixing ${tableName}.${columnName} ENUM...`);

  try {
    // Step 1: Check if ENUM type exists
    console.log('  1️⃣ Checking ENUM type...');
    const enumCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = $1
      ) as exists
    `, [enumTypeName]);

    if (!enumCheck.rows[0].exists) {
      console.log('    Creating ENUM type...');
      const enumValuesStr = enumValues.map(v => `'${v}'`).join(', ');
      await client.query(`
        CREATE TYPE ${enumTypeName} AS ENUM (${enumValuesStr})
      `);
      console.log('    ✅ ENUM type created');
    } else {
      console.log('    ✓ ENUM type already exists');
    }

    // Step 2: Check current column type
    const columnCheck = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `, [tableName, columnName]);

    if (columnCheck.rows.length === 0) {
      console.log(`    ⚠️ Column ${columnName} not found in ${tableName}`);
      return;
    }

    const currentType = columnCheck.rows[0].data_type;
    
    if (currentType === 'USER-DEFINED') {
      console.log('    ✓ Column already using ENUM type');
      return;
    }

    // Step 3: Drop default temporarily
    console.log('  2️⃣ Dropping default value...');
    await client.query(`
      ALTER TABLE ${tableName} 
      ALTER COLUMN ${columnName} DROP DEFAULT
    `);
    console.log('    ✅ Default dropped');

    // Step 4: Convert column to ENUM
    console.log('  3️⃣ Converting column to ENUM...');
    await client.query(`
      ALTER TABLE ${tableName} 
      ALTER COLUMN ${columnName} TYPE ${enumTypeName} 
      USING ${columnName}::${enumTypeName}
    `);
    console.log('    ✅ Column converted');

    // Step 5: Set default back if provided
    if (defaultValue) {
      console.log('  4️⃣ Setting default value...');
      await client.query(`
        ALTER TABLE ${tableName} 
        ALTER COLUMN ${columnName} SET DEFAULT '${defaultValue}'::${enumTypeName}
      `);
      console.log('    ✅ Default set');

      // Step 6: Update any NULL values
      console.log('  5️⃣ Updating NULL values...');
      const updateResult = await client.query(`
        UPDATE ${tableName} 
        SET ${columnName} = '${defaultValue}'::${enumTypeName} 
        WHERE ${columnName} IS NULL
      `);
      console.log(`    ✅ Updated ${updateResult.rowCount} rows`);
    }

    console.log(`  ✅ ${tableName}.${columnName} ENUM fixed successfully!`);

  } catch (error) {
    console.error(`  ❌ Error fixing ${tableName}.${columnName}:`, error.message);
  }
}

async function fixAllEnums() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing all ENUM columns in database...\n');
    console.log('━'.repeat(60));

    // Fix UserSettings.theme
    await fixEnum(
      client,
      'user_settings',
      'theme',
      'enum_user_settings_theme',
      ['light', 'dark', 'auto'],
      'auto'
    );

    // Fix FocusSession.status
    await fixEnum(
      client,
      'focus_sessions',
      'status',
      'enum_focus_sessions_status',
      ['active', 'paused', 'completed', 'cancelled'],
      'active'
    );

    // Fix OTP.type (no default value)
    await fixEnum(
      client,
      'otp_codes',
      'type',
      'enum_otp_codes_type',
      ['login', 'registration', 'password_reset', 'email_verification', 'phone_verification'],
      null
    );

    // Fix Notification.type
    await fixEnum(
      client,
      'notifications',
      'type',
      'enum_notifications_type',
      ['general', 'reminder', 'task', 'achievement', 'system'],
      'general'
    );

    // Fix Notification.priority
    await fixEnum(
      client,
      'notifications',
      'priority',
      'enum_notifications_priority',
      ['low', 'normal', 'high', 'urgent'],
      'normal'
    );

    console.log('\n━'.repeat(60));
    console.log('\n✅ All ENUM columns fixed successfully!');
    console.log('\n💡 You can now restart the server without ENUM casting errors.');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllEnums();
