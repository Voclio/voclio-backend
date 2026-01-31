import pg from 'pg';
import dotenv from 'dotenv';
import aiService from './src/services/ai.service.js';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voclio_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function testExtractFlow() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Extract Tasks Flow...\n');

    // 1. Check note content
    console.log('1️⃣ Checking note 8 content...');
    const noteResult = await client.query('SELECT * FROM notes WHERE note_id = 8');
    
    if (noteResult.rows.length === 0) {
      console.log('❌ Note 8 not found!');
      console.log('\n📝 Creating a test note...');
      
      const testContent = `
        اجتماع مع الفريق يوم الأحد الساعة 10 صباحاً
        إنهاء التقرير الشهري قبل نهاية الأسبوع
        الاتصال بالعميل أحمد لمتابعة المشروع
        شراء مستلزمات المكتب
      `;
      
      const createResult = await client.query(`
        INSERT INTO notes (user_id, title, content, created_at, updated_at)
        VALUES (1, 'Test Note', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [testContent]);
      
      console.log('✅ Created note:', createResult.rows[0].note_id);
      console.log('Content:', testContent);
      
      // Extract tasks
      console.log('\n2️⃣ Extracting tasks from new note...');
      const tasks = await aiService.extractTasks(testContent);
      console.log('✅ Extracted tasks:', tasks.length);
      console.log(JSON.stringify(tasks, null, 2));
      
    } else {
      const note = noteResult.rows[0];
      console.log('✅ Found note 8');
      console.log('Title:', note.title);
      console.log('Content:', note.content);
      console.log('Content length:', note.content?.length || 0);
      
      if (!note.content || note.content.trim().length === 0) {
        console.log('\n⚠️ Note content is empty!');
        console.log('Please add content to the note first.');
      } else {
        console.log('\n2️⃣ Extracting tasks...');
        const tasks = await aiService.extractTasks(note.content);
        console.log('✅ Extracted tasks:', tasks.length);
        console.log(JSON.stringify(tasks, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testExtractFlow();
