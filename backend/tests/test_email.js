const emailService = require('../src/services/emailService');
const notificationService = require('../src/services/notificationService');

async function runTests() {
  console.log('Testing Email Service Initialization...');
  if (!emailService.resend) {
    console.log('✅ Email service initialized securely (mock mode, no RESEND_API_KEY found)');
  }

  console.log('\nTesting Notification Service methods...');
  try {
    // Just testing the method exists and handles unconfigured supabase gracefully
    const users = await notificationService.getSubscribedUsers();
    console.log(`✅ getSubscribedUsers returned array of length: ${users.length}`);
  } catch (err) {
    if (err.message.includes('Supabase is not configured')) {
      console.log('✅ getSubscribedUsers handled unconfigured state gracefully.');
    } else {
      console.error('❌ Failed:', err);
    }
  }
}

runTests();
