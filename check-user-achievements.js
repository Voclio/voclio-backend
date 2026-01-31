import pg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voclio_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function checkUserAchievements() {
  const client = await pool.connect();
  
  try {
    // Get the token from Postman (you need to paste it here)
    const token = 'YOUR_TOKEN_HERE'; // Replace with actual token from Postman
    
    // Decode token to get user_id
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
      console.log('🔑 Token user_id:', userId);
    } catch (e) {
      console.log('⚠️ Could not decode token, checking all users...\n');
    }

    // Check all users
    console.log('👥 All users:');
    const users = await client.query('SELECT user_id, email, name FROM users LIMIT 5');
    users.rows.forEach(u => {
      console.log(`  - User ${u.user_id}: ${u.email} (${u.name})`);
    });

    console.log('\n🏆 All achievements:');
    const achievements = await client.query('SELECT * FROM achievements ORDER BY user_id, achievement_id');
    if (achievements.rows.length === 0) {
      console.log('  ❌ No achievements found!');
    } else {
      achievements.rows.forEach(a => {
        console.log(`  - User ${a.user_id}: ${a.title} (${a.achievement_type})`);
      });
    }

    // If we have a user_id, check their achievements
    if (userId) {
      console.log(`\n🎯 Achievements for user ${userId}:`);
      const userAchievements = await client.query(
        'SELECT * FROM achievements WHERE user_id = $1',
        [userId]
      );
      if (userAchievements.rows.length === 0) {
        console.log('  ❌ No achievements for this user!');
        console.log('\n  💡 Adding test achievements...');
        await client.query(`
          INSERT INTO achievements (user_id, achievement_type, title, description, earned_at, created_at)
          VALUES 
            ($1, 'first_task', 'أول مهمة', 'أكملت أول مهمة لك!', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ($1, 'streak_7', 'سلسلة 7 أيام', 'حافظت على سلسلة 7 أيام متتالية', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ($1, 'focus_master', 'خبير التركيز', 'أكملت 10 جلسات تركيز', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [userId]);
        console.log('  ✅ Added 3 test achievements!');
      } else {
        userAchievements.rows.forEach(a => {
          console.log(`  🏆 ${a.title} - ${a.description}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('📋 Checking user achievements...\n');
console.log('⚠️ Please update the token in the script with your actual token from Postman\n');
checkUserAchievements();
