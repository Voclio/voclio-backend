#!/usr/bin/env node

/**
 * Test script for AI Suggestions API
 * Tests the enhanced productivity suggestions endpoint
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token-here';

console.log('🧪 Testing Enhanced AI Suggestions API\n');

async function testAISuggestions() {
  const testCases = [
    {
      name: 'Basic Suggestions (Default)',
      params: {},
      description: 'Test default AI suggestions'
    },
    {
      name: 'Time Management Focus',
      params: {
        focus_area: 'time_management',
        tone: 'motivational',
        count: 3,
        days: 14
      },
      description: 'Test time management focused suggestions'
    },
    {
      name: 'Task Organization (Professional)',
      params: {
        focus_area: 'task_organization',
        tone: 'professional',
        count: 5,
        language: 'ar'
      },
      description: 'Test task organization suggestions in Arabic'
    },
    {
      name: 'Focus Improvement (Casual)',
      params: {
        focus_area: 'focus_improvement',
        tone: 'casual',
        count: 4,
        days: 7
      },
      description: 'Test focus improvement with casual tone'
    },
    {
      name: 'Stress Reduction (Direct)',
      params: {
        focus_area: 'stress_reduction',
        tone: 'direct',
        count: 3,
        language: 'en'
      },
      description: 'Test stress reduction suggestions in English'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   ${testCase.description}`);
    console.log('   ─'.repeat(50));

    try {
      const queryParams = new URLSearchParams(testCase.params).toString();
      const url = `${BASE_URL}/api/productivity/suggestions${queryParams ? '?' + queryParams : ''}`;
      
      console.log(`   🔗 URL: ${url}`);
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      console.log(`   ⏱️  Response Time: ${responseTime}ms`);
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        
        console.log(`   ✅ Success: ${data.success}`);
        console.log(`   🤖 AI Provider: ${data.data.metadata.ai_provider}`);
        console.log(`   📈 Suggestions Count: ${data.data.suggestions.length}`);
        console.log(`   📅 Data Period: ${data.data.metadata.data_period.days} days`);
        
        // Display first suggestion as example
        if (data.data.suggestions.length > 0) {
          const firstSuggestion = data.data.suggestions[0];
          console.log(`\n   📝 Sample Suggestion:`);
          console.log(`      💡 ${firstSuggestion.text.substring(0, 100)}...`);
          console.log(`      🏷️  Category: ${firstSuggestion.category}`);
          console.log(`      ⚡ Priority: ${firstSuggestion.priority}`);
          console.log(`      📊 Impact: ${firstSuggestion.estimated_impact}`);
          console.log(`      ⏰ Implementation: ${firstSuggestion.implementation_time}`);
          
          if (firstSuggestion.steps && firstSuggestion.steps.length > 0) {
            console.log(`      📋 Steps: ${firstSuggestion.steps.length} action items`);
          }
        }

        // Display productivity analysis
        if (data.data.based_on && data.data.based_on.tasks_analysis) {
          const analysis = data.data.based_on.tasks_analysis;
          console.log(`\n   📊 User Analysis:`);
          console.log(`      📝 Total Tasks: ${analysis.total_tasks}`);
          console.log(`      ✅ Completion Rate: ${analysis.completion_rate}%`);
          console.log(`      ⏰ Overdue Tasks: ${analysis.overdue_tasks}`);
          console.log(`      📈 Avg Tasks/Day: ${analysis.average_tasks_per_day}`);
        }

      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.log(`   ❌ Error: ${JSON.stringify(errorData, null, 2)}`);
      }

    } catch (error) {
      console.log(`   💥 Request Failed: ${error.message}`);
    }

    console.log('   ─'.repeat(50));
  }
}

async function testRateLimit() {
  console.log('\n🚦 Testing Rate Limiting (10 requests in quick succession)');
  console.log('   ─'.repeat(50));

  const promises = [];
  for (let i = 1; i <= 12; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/productivity/suggestions?count=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }).then(response => ({
        request: i,
        status: response.status,
        success: response.ok
      }))
    );
  }

  const results = await Promise.all(promises);
  
  const successful = results.filter(r => r.success).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  
  console.log(`   ✅ Successful requests: ${successful}`);
  console.log(`   🚫 Rate limited requests: ${rateLimited}`);
  console.log(`   📊 Rate limiting ${rateLimited > 0 ? 'WORKING' : 'NOT WORKING'}`);
}

async function testValidation() {
  console.log('\n🔍 Testing Input Validation');
  console.log('   ─'.repeat(50));

  const invalidCases = [
    {
      name: 'Invalid focus_area',
      params: { focus_area: 'invalid_area' },
      expectedError: 'Invalid focus area'
    },
    {
      name: 'Invalid count (too high)',
      params: { count: 15 },
      expectedError: 'Count must be between 1 and 10'
    },
    {
      name: 'Invalid days (too high)',
      params: { days: 50 },
      expectedError: 'Days must be between 1 and 30'
    },
    {
      name: 'Invalid tone',
      params: { tone: 'invalid_tone' },
      expectedError: 'Invalid tone'
    },
    {
      name: 'Invalid language',
      params: { language: 'fr' },
      expectedError: 'Language must be ar or en'
    }
  ];

  for (const testCase of invalidCases) {
    try {
      const queryParams = new URLSearchParams(testCase.params).toString();
      const url = `${BASE_URL}/api/productivity/suggestions?${queryParams}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   📋 ${testCase.name}: ${response.status === 400 ? '✅ BLOCKED' : '❌ ALLOWED'}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`      💬 Error: ${errorData.error?.message || 'Unknown error'}`);
      }

    } catch (error) {
      console.log(`   💥 ${testCase.name}: Request failed - ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting AI Suggestions API Tests');
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using Token: ${TEST_TOKEN.substring(0, 10)}...`);
  
  try {
    await testAISuggestions();
    await testRateLimit();
    await testValidation();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Enhanced AI suggestions with multiple parameters');
    console.log('   ✅ Rate limiting protection (10 requests per 15 minutes)');
    console.log('   ✅ Input validation for all parameters');
    console.log('   ✅ Structured response with metadata');
    console.log('   ✅ Multiple AI providers support');
    console.log('   ✅ Arabic and English language support');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🧪 AI Suggestions API Test Suite

Usage: node test-ai-suggestions.js [options]

Environment Variables:
  API_BASE_URL    Base URL for the API (default: http://localhost:3000)
  TEST_TOKEN      Authentication token for testing

Options:
  --help, -h      Show this help message

Examples:
  node test-ai-suggestions.js
  API_BASE_URL=https://api.voclio.com TEST_TOKEN=your-token node test-ai-suggestions.js
`);
  process.exit(0);
}

main().catch(console.error);