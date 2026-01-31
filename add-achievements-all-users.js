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

async function addAchievementsForAllUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🏆 Adding achievements for all users...\n');

    // Get all users
    const users = await client.query('SELECT user_id, email FROM users');
    console.log(`Found ${users.rows.length} users\n`);

    for (const user of users.rows) {
      console.log(`Adding achievements for ${user.email}...`);
      
      // Check if user already has achievements
      const existing = await client.query(
        'SELECT COUNT(*) FROM achievements WHERE user_id = $1',
        [user.user_id]
      );

      if (parseInt(existing.rows[0].count) > 0) {
        console.log(`  ✓ User already has ${existing.rows[0].count} achievements`);
        continue;
      }

      // Add achievements
      await client.query(`
        INSERT INTO achievements (user_id, achievement_type, title, description, earned_at, created_at)
        VALUES 
          ($1, 'first_task', 'أول مهمة', 'أكملت أول مهمة لك!', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ($1, 'streak_7', 'سلسلة 7 أيام', 'حافظت على سلسلة 7 أيام متتالية', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ($1, 'focus_master', 'خبير التركيز', 'أكملت 10 جلسات تركيز', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [user.user_id]);

      console.log(`  ✅ Added 3 achievements`);
    }

    console.log('\n✅ Done! All users now have achievements');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addAchievementsForAllUsers();
