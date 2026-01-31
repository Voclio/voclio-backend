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

async function checkEnumStatus() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking ENUM Types Status\n');
    console.log('━'.repeat(80));

    // Check all ENUM types
    console.log('\n📋 ENUM Types in Database:\n');
    const enumTypes = await client.query(`
      SELECT 
        t.typname as enum_name,
        string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE 'enum_%'
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    if (enumTypes.rows.length === 0) {
      console.log('  ⚠️  No ENUM types found');
    } else {
      enumTypes.rows.forEach(row => {
        console.log(`  ✅ ${row.enum_name}`);
        console.log(`     Values: ${row.enum_values}`);
        console.log('');
      });
    }

    // Check columns using ENUM types
    console.log('━'.repeat(80));
    console.log('\n📊 Columns Using ENUM Types:\n');
    const enumColumns = await client.query(`
      SELECT 
        c.table_name,
        c.column_name,
        c.udt_name as enum_type,
        c.column_default,
        c.is_nullable
      FROM information_schema.columns c
      WHERE c.data_type = 'USER-DEFINED'
        AND c.table_schema = 'public'
        AND c.udt_name LIKE 'enum_%'
      ORDER BY c.table_name, c.column_name
    `);

    if (enumColumns.rows.length === 0) {
      console.log('  ⚠️  No columns using ENUM types');
    } else {
      let currentTable = '';
      enumColumns.rows.forEach(row => {
        if (currentTable !== row.table_name) {
          if (currentTable !== '') console.log('');
          currentTable = row.table_name;
          console.log(`  📁 ${row.table_name}`);
        }
        const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(required)';
        const defaultVal = row.column_default ? `default: ${row.column_default}` : 'no default';
        console.log(`     ├─ ${row.column_name}: ${row.enum_type} ${nullable}`);
        console.log(`     │  ${defaultVal}`);
      });
    }

    // Check for potential issues
    console.log('\n━'.repeat(80));
    console.log('\n🔍 Checking for Potential Issues:\n');

    // Check for VARCHAR columns that should be ENUM
    const varcharColumns = await client.query(`
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.column_default
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.data_type = 'character varying'
        AND (
          c.column_name IN ('theme', 'status', 'type', 'priority')
          OR c.table_name IN ('user_settings', 'focus_sessions', 'otp_codes', 'notifications')
        )
      ORDER BY c.table_name, c.column_name
    `);

    if (varcharColumns.rows.length === 0) {
      console.log('  ✅ No VARCHAR columns found that should be ENUM');
    } else {
      console.log('  ⚠️  Found VARCHAR columns that might need ENUM conversion:');
      varcharColumns.rows.forEach(row => {
        console.log(`     - ${row.table_name}.${row.column_name} (${row.data_type})`);
      });
    }

    // Summary
    console.log('\n━'.repeat(80));
    console.log('\n📊 Summary:\n');
    console.log(`  ENUM Types: ${enumTypes.rows.length}`);
    console.log(`  Columns using ENUM: ${enumColumns.rows.length}`);
    console.log(`  Potential issues: ${varcharColumns.rows.length}`);
    
    if (enumTypes.rows.length >= 5 && varcharColumns.rows.length === 0) {
      console.log('\n  ✅ All ENUM types are properly configured!');
    } else if (varcharColumns.rows.length > 0) {
      console.log('\n  ⚠️  Some columns may need ENUM conversion. Run: npm run fix:enums');
    }

    console.log('\n━'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkEnumStatus();
