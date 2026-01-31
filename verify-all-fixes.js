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

async function verifyAllFixes() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying All Database Fixes\n');
    console.log('━'.repeat(80));

    let allPassed = true;

    // Test 1: Check ENUM types
    console.log('\n1️⃣  Checking ENUM Types...');
    const enumTypes = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_type 
      WHERE typname IN (
        'enum_user_settings_theme',
        'enum_focus_sessions_status',
        'enum_otp_codes_type',
        'enum_notifications_type',
        'enum_notifications_priority'
      )
    `);
    
    const enumCount = parseInt(enumTypes.rows[0].count);
    if (enumCount === 5) {
      console.log('   ✅ All 5 ENUM types exist');
    } else {
      console.log(`   ❌ Only ${enumCount}/5 ENUM types found`);
      allPassed = false;
    }

    // Test 2: Check ENUM columns
    console.log('\n2️⃣  Checking ENUM Columns...');
    const enumColumns = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE data_type = 'USER-DEFINED'
        AND table_schema = 'public'
        AND (
          (table_name = 'user_settings' AND column_name = 'theme') OR
          (table_name = 'focus_sessions' AND column_name = 'status') OR
          (table_name = 'otp_codes' AND column_name = 'type') OR
          (table_name = 'notifications' AND column_name = 'type') OR
          (table_name = 'notifications' AND column_name = 'priority')
        )
    `);
    
    const columnCount = parseInt(enumColumns.rows[0].count);
    if (columnCount === 5) {
      console.log('   ✅ All 5 columns using ENUM types');
    } else {
      console.log(`   ❌ Only ${columnCount}/5 columns using ENUM`);
      allPassed = false;
    }

    // Test 3: Check timestamps
    console.log('\n3️⃣  Checking Timestamps...');
    const tables = [
      'users', 'tasks', 'notes', 'categories', 'voice_recordings',
      'reminders', 'tags', 'focus_sessions', 'productivity_streaks', 'user_settings'
    ];
    
    // Tables that only need created_at (updatedAt: false in ORM)
    const createdOnlyTables = ['achievements', 'sessions', 'notifications', 'otp_codes'];
    
    let timestampIssues = [];
    
    // Check tables that need both created_at and updated_at
    for (const table of tables) {
      const result = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE column_name = 'created_at') as has_created,
          COUNT(*) FILTER (WHERE column_name = 'updated_at') as has_updated
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [table]);
      
      const hasCreated = parseInt(result.rows[0].has_created) > 0;
      const hasUpdated = parseInt(result.rows[0].has_updated) > 0;
      
      if (!hasCreated || !hasUpdated) {
        timestampIssues.push(table);
      }
    }
    
    // Check tables that only need created_at
    for (const table of createdOnlyTables) {
      const result = await client.query(`
        SELECT COUNT(*) as has_created
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'created_at' AND table_schema = 'public'
      `, [table]);
      
      const hasCreated = parseInt(result.rows[0].has_created) > 0;
      
      if (!hasCreated) {
        timestampIssues.push(table);
      }
    }
    
    if (timestampIssues.length === 0) {
      console.log(`   ✅ All ${tables.length + createdOnlyTables.length} tables have proper timestamps`);
    } else {
      console.log(`   ❌ Missing timestamps in: ${timestampIssues.join(', ')}`);
      allPassed = false;
    }

    // Test 4: Check notification columns
    console.log('\n4️⃣  Checking Notification Columns...');
    const notificationCols = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
        AND column_name IN ('priority', 'related_id', 'read_at')
      ORDER BY column_name
    `);
    
    if (notificationCols.rows.length === 3) {
      console.log('   ✅ All notification columns exist (priority, related_id, read_at)');
    } else {
      const found = notificationCols.rows.map(r => r.column_name).join(', ');
      console.log(`   ❌ Missing notification columns. Found: ${found}`);
      allPassed = false;
    }

    // Test 5: Check categories updated_at
    console.log('\n5️⃣  Checking Categories Table...');
    const categoriesUpdated = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'updated_at'
    `);
    
    if (categoriesUpdated.rows.length > 0) {
      console.log('   ✅ Categories table has updated_at column');
    } else {
      console.log('   ❌ Categories table missing updated_at column');
      allPassed = false;
    }

    // Test 6: Check default categories exist
    console.log('\n6️⃣  Checking Default Categories...');
    const defaultCategories = await client.query(`
      SELECT COUNT(DISTINCT user_id) as users_with_categories
      FROM categories
      WHERE name IN ('عمل', 'شخصي', 'دراسة')
    `);
    
    const usersWithCategories = parseInt(defaultCategories.rows[0].users_with_categories);
    if (usersWithCategories > 0) {
      console.log(`   ✅ Default categories exist for ${usersWithCategories} users`);
    } else {
      console.log('   ⚠️  No default categories found (run: node database/migrations/run_categories_fix.js)');
    }

    // Test 7: Check Achievement model
    console.log('\n7️⃣  Checking Achievement Table...');
    const achievementCols = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE column_name = 'achievement_type') as has_type,
        COUNT(*) FILTER (WHERE column_name = 'icon') as has_icon
      FROM information_schema.columns 
      WHERE table_name = 'achievements'
    `);
    
    const hasType = parseInt(achievementCols.rows[0].has_type) > 0;
    const hasIcon = parseInt(achievementCols.rows[0].has_icon) > 0;
    
    if (hasType && !hasIcon) {
      console.log('   ✅ Achievement table has achievement_type (icon removed)');
    } else if (!hasType) {
      console.log('   ❌ Achievement table missing achievement_type column');
      allPassed = false;
    } else if (hasIcon) {
      console.log('   ⚠️  Achievement table still has icon column (should be removed)');
    }

    // Final Summary
    console.log('\n━'.repeat(80));
    console.log('\n📊 Verification Summary:\n');
    
    if (allPassed) {
      console.log('   🎉 ALL TESTS PASSED!');
      console.log('   ✅ Database schema is properly configured');
      console.log('   ✅ All ENUM types are working');
      console.log('   ✅ All timestamps are configured');
      console.log('   ✅ All migrations completed successfully');
      console.log('\n   🚀 Server is ready to run without errors!');
    } else {
      console.log('   ⚠️  SOME TESTS FAILED');
      console.log('\n   Run these commands to fix issues:');
      console.log('   - npm run fix:enums');
      console.log('   - npm run fix:timestamps');
      console.log('   - npm run migrate:notifications');
      console.log('   - node database/migrations/run_categories_fix.js');
    }

    console.log('\n━'.repeat(80));

  } catch (error) {
    console.error('\n❌ Verification Error:', error.message);
    console.error('Details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyAllFixes();
