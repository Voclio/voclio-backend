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

async function checkCategories() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Checking categories...\n');
    
    // Check categories
    const categoriesResult = await client.query('SELECT * FROM categories ORDER BY category_id LIMIT 10');
    console.log('Categories:', categoriesResult.rows);
    
    // Check users
    const usersResult = await client.query('SELECT user_id, email, name FROM users LIMIT 5');
    console.log('\nUsers:', usersResult.rows);
    
    // Create a default category if none exists
    if (categoriesResult.rows.length === 0) {
      console.log('\n⚠️ No categories found. Creating default categories...');
      
      const users = usersResult.rows;
      if (users.length > 0) {
        for (const user of users) {
          await client.query(`
            INSERT INTO categories (user_id, name, color, description, created_at)
            VALUES 
              ($1, 'عمل', '#FF5733', 'مهام متعلقة بالعمل', CURRENT_TIMESTAMP),
              ($1, 'شخصي', '#33C3FF', 'مهام شخصية', CURRENT_TIMESTAMP),
              ($1, 'دراسة', '#33FF57', 'مهام دراسية', CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING
          `, [user.user_id]);
        }
        
        const newCategories = await client.query('SELECT * FROM categories');
        console.log('\n✅ Default categories created:', newCategories.rows);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCategories();
