import NotificationService from './src/services/notification.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testNotifications() {
  console.log('🧪 Testing Notification System...\n');

  try {
    // Test 1: Create a task notification
    console.log('1️⃣ Testing task notification...');
    const taskNotif = await NotificationService.notifyTaskCreated(1, {
      task_id: 999,
      title: 'مهمة اختبار',
      priority: 'high'
    });
    console.log('✅ Task notification created:', taskNotif.notification_id);

    // Test 2: Create a welcome notification
    console.log('\n2️⃣ Testing welcome notification...');
    const welcomeNotif = await NotificationService.notifyWelcome(1, 'أحمد');
    console.log('✅ Welcome notification created:', welcomeNotif.notification_id);

    // Test 3: Create a reminder notification
    console.log('\n3️⃣ Testing reminder notification...');
    const reminderNotif = await NotificationService.notifyReminderTriggered(1, {
      reminder_id: 888
    }, {
      title: 'اجتماع مهم'
    });
    console.log('✅ Reminder notification created:', reminderNotif.notification_id);

    // Test 4: Get notification stats
    console.log('\n4️⃣ Testing notification stats...');
    const stats = await NotificationService.getNotificationStats(1);
    console.log('✅ Notification stats:', stats);

    console.log('\n🎉 All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testNotifications();
