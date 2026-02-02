/**
 * Webex Calendar Integration Usage Examples
 * 
 * This file demonstrates how to use the Webex Calendar API integration
 * in the Voclio system.
 */

import WebexCalendarService from '../src/services/webexCalendar.service.js';

const webexService = new WebexCalendarService();

// Example: Generate OAuth URL for Webex authorization
function generateWebexAuthUrl() {
  console.log('🔗 Generating Webex OAuth URL...');
  
  const authUrl = webexService.generateAuthUrl();
  console.log('Authorization URL:', authUrl);
  console.log('📝 Visit this URL to authorize Webex access');
  
  return authUrl;
}

// Example: Exchange authorization code for tokens
async function exchangeCodeForTokens(authorizationCode) {
  try {
    console.log('🔄 Exchanging authorization code for tokens...');
    
    const tokens = await webexService.getTokens(authorizationCode);
    console.log('✅ Tokens received:', {
      access_token: tokens.access_token ? '***' : 'Not received',
      refresh_token: tokens.refresh_token ? '***' : 'Not received',
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      scope: tokens.scope
    });
    
    return tokens;
  } catch (error) {
    console.error('❌ Error exchanging code:', error.message);
    throw error;
  }
}

// Example: Get user's Webex meetings
async function getUserMeetings(accessToken, options = {}) {
  try {
    console.log('📅 Fetching user meetings...');
    
    const meetings = await webexService.getMeetings(accessToken, options);
    console.log(`✅ Found ${meetings.length} meetings`);
    
    meetings.forEach((meeting, index) => {
      console.log(`\n📋 Meeting ${index + 1}:`);
      console.log(`  Title: ${meeting.title}`);
      console.log(`  Start: ${meeting.start}`);
      console.log(`  End: ${meeting.end}`);
      console.log(`  Meeting Number: ${meeting.meetingNumber}`);
      console.log(`  Join URL: ${meeting.webLink}`);
      console.log(`  Host: ${meeting.hostDisplayName} (${meeting.hostEmail})`);
      console.log(`  State: ${meeting.state}`);
    });
    
    return meetings;
  } catch (error) {
    console.error('❌ Error fetching meetings:', error.message);
    throw error;
  }
}

// Example: Get today's meetings
async function getTodayMeetings(accessToken) {
  try {
    console.log('📅 Fetching today\'s meetings...');
    
    const meetings = await webexService.getTodayMeetings(accessToken);
    console.log(`✅ Found ${meetings.length} meetings for today`);
    
    return meetings;
  } catch (error) {
    console.error('❌ Error fetching today\'s meetings:', error.message);
    throw error;
  }
}

// Example: Create a new Webex meeting
async function createMeeting(accessToken, meetingData) {
  try {
    console.log('➕ Creating new Webex meeting...');
    
    const meeting = await webexService.createMeeting(accessToken, meetingData);
    console.log('✅ Meeting created successfully:');
    console.log(`  Meeting ID: ${meeting.id}`);
    console.log(`  Title: ${meeting.title}`);
    console.log(`  Start: ${meeting.start}`);
    console.log(`  Join URL: ${meeting.webLink}`);
    console.log(`  Meeting Number: ${meeting.meetingNumber}`);
    console.log(`  Password: ${meeting.password || 'No password'}`);
    
    return meeting;
  } catch (error) {
    console.error('❌ Error creating meeting:', error.message);
    throw error;
  }
}

// Example: Get user profile
async function getUserProfile(accessToken) {
  try {
    console.log('👤 Fetching user profile...');
    
    const profile = await webexService.getUserProfile(accessToken);
    console.log('✅ User profile:', {
      id: profile.id,
      displayName: profile.displayName,
      emails: profile.emails,
      userName: profile.userName,
      created: profile.created,
      lastActivity: profile.lastActivity
    });
    
    return profile;
  } catch (error) {
    console.error('❌ Error fetching user profile:', error.message);
    throw error;
  }
}

// Example usage scenarios
async function exampleUsage() {
  console.log('🚀 Webex Calendar Integration Examples\n');
  
  // Step 1: Generate authorization URL
  console.log('=== Step 1: Authorization ===');
  const authUrl = generateWebexAuthUrl();
  console.log('\n📝 Instructions:');
  console.log('1. Visit the authorization URL above');
  console.log('2. Sign in to your Webex account');
  console.log('3. Grant permissions to the application');
  console.log('4. Copy the authorization code from the callback URL');
  console.log('5. Use the code in the next step\n');
  
  // Note: In a real application, you would get the authorization code from the OAuth callback
  const exampleAuthCode = 'your_authorization_code_here';
  
  try {
    // Step 2: Exchange code for tokens (commented out for example)
    // const tokens = await exchangeCodeForTokens(exampleAuthCode);
    // const accessToken = tokens.access_token;
    
    // For demonstration, we'll use a placeholder
    const accessToken = 'your_access_token_here';
    
    console.log('=== Step 2: User Profile ===');
    // await getUserProfile(accessToken);
    
    console.log('\n=== Step 3: Fetch Meetings ===');
    // await getUserMeetings(accessToken, { max: 10 });
    
    console.log('\n=== Step 4: Today\'s Meetings ===');
    // await getTodayMeetings(accessToken);
    
    console.log('\n=== Step 5: Create Meeting ===');
    const newMeetingData = {
      title: 'Team Standup Meeting',
      agenda: 'Daily team standup to discuss progress and blockers',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 30 minutes later
      timezone: 'Asia/Riyadh',
      enabledAutoRecordMeeting: false,
      allowAnyUserToBeCoHost: true,
      enabledJoinBeforeHost: true,
      joinBeforeHostMinutes: 5,
      publicMeeting: false,
      sendEmail: true
    };
    
    // await createMeeting(accessToken, newMeetingData);
    
  } catch (error) {
    console.error('❌ Example execution failed:', error.message);
  }
}

// API Endpoints Reference
function showAPIEndpoints() {
  console.log('\n📚 Webex Calendar API Endpoints Reference:');
  console.log('\n🔐 Authentication:');
  console.log('  GET  /api/webex/auth                    - Get authorization URL');
  console.log('  GET  /api/webex/callback               - OAuth callback handler');
  console.log('  GET  /api/webex/status                 - Check connection status');
  console.log('  POST /api/webex/disconnect             - Disconnect Webex account');
  
  console.log('\n📅 Meetings:');
  console.log('  GET  /api/webex/meetings               - Get meetings (with date filters)');
  console.log('  GET  /api/webex/meetings/today         - Get today\'s meetings');
  console.log('  POST /api/webex/meetings               - Create new meeting');
  console.log('  GET  /api/webex/meetings/:id           - Get meeting by ID');
  console.log('  PUT  /api/webex/meetings/:id           - Update meeting');
  console.log('  DELETE /api/webex/meetings/:id         - Delete meeting');
  
  console.log('\n📋 Combined Calendar:');
  console.log('  GET  /api/calendar/events              - Get all events (tasks, reminders, Google, Webex)');
  console.log('       ?include_google=true              - Include Google Calendar events');
  console.log('       ?include_webex=true               - Include Webex meetings');
  console.log('  GET  /api/calendar/meetings/upcoming   - Get upcoming meetings from all sources');
  
  console.log('\n🔧 Required Headers:');
  console.log('  Authorization: Bearer <jwt_token>      - User authentication token');
  console.log('  Content-Type: application/json         - For POST/PUT requests');
}

// Environment Variables Reference
function showEnvironmentVariables() {
  console.log('\n🔧 Required Environment Variables:');
  console.log('\n# Webex OAuth Configuration');
  console.log('WEBEX_CLIENT_ID=your_webex_client_id_here');
  console.log('WEBEX_CLIENT_SECRET=your_webex_client_secret_here');
  console.log('WEBEX_REDIRECT_URI=http://localhost:3000/api/webex/callback');
  console.log('WEBEX_API_URL=https://webexapis.com/v1');
  
  console.log('\n📝 Setup Instructions:');
  console.log('1. Go to https://developer.webex.com/');
  console.log('2. Create a new application');
  console.log('3. Set the redirect URI to match your server');
  console.log('4. Copy the Client ID and Client Secret');
  console.log('5. Add them to your .env file');
  console.log('6. Run the database migration: npm run migrate:webex');
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Webex Calendar Integration Guide\n');
  
  showEnvironmentVariables();
  showAPIEndpoints();
  
  console.log('\n' + '='.repeat(60));
  await exampleUsage();
}

export {
  generateWebexAuthUrl,
  exchangeCodeForTokens,
  getUserMeetings,
  getTodayMeetings,
  createMeeting,
  getUserProfile,
  exampleUsage,
  showAPIEndpoints,
  showEnvironmentVariables
};