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

async function addTestAchievement() {
  const client = await pool.connect();
  
  try {
    console.log('🏆 Adding test achievement...\n');

    const result = await client.query(`
      INSERT INTO achievements (user_id, achievement_type, title, description, earned_at, created_at)
      VALUES 
        (1, 'first_task', 'أول مهمة', 'أكملت أول مهمة لك!', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (1, 'streak_7', 'سلسلة 7 أيام', 'حافظت على سلسلة 7 أيام متتالية', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (1, 'focus_master', 'خبير التركيز', 'أكملت 10 جلسات تركيز', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `);

    console.log('✅ Added achievements:', result.rows.length);
    result.rows.forEach(a => {
      console.log(`  🏆 ${a.title} - ${a.description}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addTestAchievement();
