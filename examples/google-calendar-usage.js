/**
 * Google Calendar Integration Usage Examples
 * 
 * This file demonstrates how to use the Google Calendar integration
 * with the Voclio API.
 */

const API_BASE_URL = 'http://localhost:3001/api';
const USER_TOKEN = 'your_jwt_token_here';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${USER_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  return await response.json();
}

// Example 1: Connect Google Calendar
async function connectGoogleCalendar() {
  console.log('🔗 Connecting Google Calendar...');
  
  try {
    // Step 1: Get OAuth URL
    const authResponse = await apiCall('/calendar/google/connect');
    console.log('📋 Visit this URL to authorize:', authResponse.data.auth_url);
    
    // Step 2: User visits URL and authorizes (manual step)
    console.log('👤 User needs to visit the URL and authorize access');
    
    // Step 3: After authorization, check status
    const statusResponse = await apiCall('/calendar/google/status');
    console.log('✅ Connection status:', statusResponse.data);
    
  } catch (error) {
    console.error('❌ Error connecting Google Calendar:', error);
  }
}

// Example 2: Get today's meetings
async function getTodayMeetings() {
  console.log('📅 Getting today\'s meetings...');
  
  try {
    const response = await apiCall('/calendar/google/today');
    
    if (response.success) {
      console.log(`📊 Found ${response.data.count} meetings today:`);
      
      response.data.meetings.forEach(meeting => {
        console.log(`  📝 ${meeting.title}`);
        console.log(`     ⏰ ${new Date(meeting.start).toLocaleTimeString()} - ${new Date(meeting.end).toLocaleTimeString()}`);
        console.log(`     📍 ${meeting.location || 'No location'}`);
        console.log(`     👥 ${meeting.attendees?.length || 0} attendees`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No meetings found or Google Calendar not connected');
    }
    
  } catch (error) {
    console.error('❌ Error getting today\'s meetings:', error);
  }
}

// Example 3: Get upcoming meetings
async function getUpcomingMeetings(days = 7) {
  console.log(`📅 Getting upcoming meetings for next ${days} days...`);
  
  try {
    const response = await apiCall(`/calendar/google/upcoming?days=${days}`);
    
    if (response.success) {
      console.log(`📊 Found ${response.data.count} upcoming meetings:`);
      
      response.data.meetings.forEach(meeting => {
        const startDate = new Date(meeting.start);
        console.log(`  📝 ${meeting.title}`);
        console.log(`     📅 ${startDate.toLocaleDateString()}`);
        console.log(`     ⏰ ${startDate.toLocaleTimeString()} - ${new Date(meeting.end).toLocaleTimeString()}`);
        console.log(`     📍 ${meeting.location || 'No location'}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No upcoming meetings found');
    }
    
  } catch (error) {
    console.error('❌ Error getting upcoming meetings:', error);
  }
}

// Example 4: Get all calendar events (tasks + reminders + meetings)
async function getAllCalendarEvents() {
  console.log('📅 Getting all calendar events...');
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // Next 30 days
  
  try {
    const response = await apiCall(
      `/calendar/events?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}&include_google=true`
    );
    
    if (response.success) {
      console.log(`📊 Found ${response.data.count} total events:`);
      console.log(`   📋 Tasks: ${response.data.tasks_count}`);
      console.log(`   🔔 Reminders: ${response.data.reminders_count}`);
      console.log(`   📅 Meetings: ${response.data.google_events_count}`);
      console.log('');
      
      // Group events by type
      const eventsByType = {
        task: [],
        reminder: [],
        meeting: []
      };
      
      response.data.events.forEach(event => {
        eventsByType[event.type]?.push(event);
      });
      
      // Display each type
      Object.entries(eventsByType).forEach(([type, events]) => {
        if (events.length > 0) {
          console.log(`${getTypeIcon(type)} ${type.toUpperCase()}S:`);
          events.forEach(event => {
            console.log(`  • ${event.title} - ${new Date(event.date).toLocaleDateString()}`);
          });
          console.log('');
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error getting calendar events:', error);
  }
}

// Example 5: Check Google Calendar connection status
async function checkConnectionStatus() {
  console.log('🔍 Checking Google Calendar connection status...');
  
  try {
    const response = await apiCall('/calendar/google/status');
    
    if (response.success) {
      const status = response.data;
      console.log('📊 Connection Status:');
      console.log(`   🔗 Connected: ${status.connected ? '✅' : '❌'}`);
      console.log(`   ⚡ Sync Enabled: ${status.sync_enabled ? '✅' : '❌'}`);
      console.log(`   📈 Sync Status: ${status.sync_status}`);
      console.log(`   📅 Calendar: ${status.calendar_name || 'N/A'}`);
      console.log(`   🕐 Last Sync: ${status.last_sync_at ? new Date(status.last_sync_at).toLocaleString() : 'Never'}`);
      
      if (status.error_message) {
        console.log(`   ⚠️  Error: ${status.error_message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking connection status:', error);
  }
}

// Example 6: Disconnect Google Calendar
async function disconnectGoogleCalendar() {
  console.log('🔌 Disconnecting Google Calendar...');
  
  try {
    const response = await apiCall('/calendar/google/disconnect', {
      method: 'DELETE'
    });
    
    if (response.success) {
      console.log('✅ Google Calendar disconnected successfully');
    }
    
  } catch (error) {
    console.error('❌ Error disconnecting Google Calendar:', error);
  }
}

// Helper function to get emoji for event types
function getTypeIcon(type) {
  const icons = {
    task: '📋',
    reminder: '🔔',
    meeting: '📅'
  };
  return icons[type] || '📝';
}

// Example usage scenarios
async function runExamples() {
  console.log('🚀 Google Calendar Integration Examples\n');
  
  // Scenario 1: First-time setup
  console.log('📋 Scenario 1: First-time setup');
  await checkConnectionStatus();
  // If not connected, user would run:
  // await connectGoogleCalendar();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Scenario 2: Daily dashboard
  console.log('📋 Scenario 2: Daily dashboard');
  await getTodayMeetings();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Scenario 3: Weekly planning
  console.log('📋 Scenario 3: Weekly planning');
  await getUpcomingMeetings(7);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Scenario 4: Complete calendar view
  console.log('📋 Scenario 4: Complete calendar view');
  await getAllCalendarEvents();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Scenario 5: Health check
  console.log('📋 Scenario 5: Health check');
  await checkConnectionStatus();
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    connectGoogleCalendar,
    getTodayMeetings,
    getUpcomingMeetings,
    getAllCalendarEvents,
    checkConnectionStatus,
    disconnectGoogleCalendar,
    runExamples
  };
}

// Run examples if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runExamples().catch(console.error);
}