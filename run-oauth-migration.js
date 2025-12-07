const pool = require('./src/config/database');

async function runOAuthMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running OAuth migration...');
    
    // Add OAuth columns
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
      ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);
    `);
    console.log('✅ Added oauth_provider and oauth_id columns');
    
    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_oauth 
      ON users(oauth_provider, oauth_id);
    `);
    console.log('✅ Created OAuth index');
    
    // Allow password to be NULL for OAuth users
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN password DROP NOT NULL;
    `);
    console.log('✅ Made password nullable for OAuth users');
    
    console.log('🎉 OAuth migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runOAuthMigration().catch(console.error);
