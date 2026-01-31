import aiService from './src/services/ai.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAIExtract() {
  console.log('🧪 Testing AI Task Extraction...\n');

  const testText = `
    اجتماع مع الفريق يوم الأحد الساعة 10 صباحاً
    إنهاء التقرير الشهري قبل نهاية الأسبوع
    الاتصال بالعميل أحمد لمتابعة المشروع
    شراء مستلزمات المكتب
  `;

  try {
    console.log('📝 Test text:', testText);
    console.log('\n🤖 Extracting tasks...\n');

    const tasks = await aiService.extractTasks(testText);
    
    console.log('✅ Extracted tasks:', JSON.stringify(tasks, null, 2));
    console.log(`\n📊 Total tasks: ${tasks.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAIExtract();
