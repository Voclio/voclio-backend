const pool = require('./config/database');
require('dotenv').config();

async function testConnection() {
  console.log('Testing database connection...\n');
  console.log('Configuration:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}\n`);

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current database time:', result.rows[0].now);
    
    const versionResult = await client.query('SELECT version()');
    console.log('PostgreSQL version:', versionResult.rows[0].version.split(' ')[0], versionResult.rows[0].version.split(' ')[1]);
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Database is ready to use!');
    console.log('\nNext step: Run "npm run init-db" to create tables.');
    
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your DB_PASSWORD in .env file');
    console.log('3. Verify database "voclio_db" exists:');
    console.log('   Run: psql -U postgres');
    console.log('   Then: CREATE DATABASE voclio_db;');
    process.exit(1);
  }
}

testConnection();
