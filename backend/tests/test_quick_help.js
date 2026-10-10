/**
 * Comprehensive Test Suite for AeroMate Quick-Dial Assistance Pad (Quick Help)
 */

const quickHelpService = require('../src/services/quickHelpService');

async function runTests() {
  console.log('====================================================');
  console.log('☎️ Starting Quick-Dial Assistance Pad Service Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ ${message}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${message}`);
      failed++;
    }
  }

  // Test 1: Get all registered commands
  const commands = quickHelpService.getAllCommands();
  assert(Array.isArray(commands) && commands.length === 8, `getAllCommands returns exactly 8 command definitions (got ${commands.length})`);
  
  const codes = commands.map(c => c.code);
  const expectedCodes = ['101', '102', '103', '104', '105', '106', '107', '108'];
  assert(expectedCodes.every(c => codes.includes(c)), `All codes 101-108 are registered: ${codes.join(', ')}`);

  // Test 2: Reject unknown codes gracefully
  const unknownRes = await quickHelpService.resolveCommand('999');
  assert(
    unknownRes.valid === false && unknownRes.message === 'Code not recognized. Please try a listed Quick Help code.',
    'Unknown code 999 is rejected with required message'
  );

  const unknownAlpha = await quickHelpService.resolveCommand('ABC');
  assert(
    unknownAlpha.valid === false && unknownAlpha.message === 'Code not recognized. Please try a listed Quick Help code.',
    'Non-numeric code is rejected gracefully'
  );

  // Test 3: Code 101 (Flight Delayed) requires flight number if missing
  const res101NoFlight = await quickHelpService.resolveCommand('101', {});
  assert(
    res101NoFlight.valid === true && res101NoFlight.contextNeeded === true && res101NoFlight.missingFields.includes('flightNumber'),
    'Code 101 flags contextNeeded when flight number is missing'
  );

  // Test 4: Code 101 with flight number retrieves status and offers route
  const res101WithFlight = await quickHelpService.resolveCommand('101', { flightNumber: 'AI645' });
  assert(
    res101WithFlight.valid === true && res101WithFlight.data.flightNumber === 'AI645' && res101WithFlight.redirectUrl.includes('/flight/AI645'),
    'Code 101 with AI645 populates delay data and points to /flight/AI645'
  );

  // Test 5: Code 102 (Flight Cancelled) routes to Disruption Manager alternatives
  const res102 = await quickHelpService.resolveCommand('102', { flightNumber: 'AI645', origin: 'DEL', destination: 'BOM' });
  assert(
    res102.valid === true && res102.redirectUrl === '/disruption' && res102.navigationState.tab === 'alternatives',
    'Code 102 routes to Disruption Center alternatives tab'
  );

  // Test 6: Code 103 (Missed Connection) routes to Disruption Impact
  const res103 = await quickHelpService.resolveCommand('103', { flightNumber: 'AI645', connectingAirport: 'DEL' });
  assert(
    res103.valid === true && res103.redirectUrl === '/disruption' && res103.navigationState.tab === 'impact',
    'Code 103 routes to Disruption Center impact engine tab'
  );

  // Test 7: Code 104 (Overnight Accommodation) routes to Hotels tab
  const res104 = await quickHelpService.resolveCommand('104', { origin: 'DEL' });
  assert(
    res104.valid === true && res104.redirectUrl === '/disruption' && res104.navigationState.tab === 'hotels',
    'Code 104 routes to Disruption Center hotels tab with origin airport'
  );

  // Test 8: Code 105 (Airport Navigation) routes to navigation guide with route
  const res105 = await quickHelpService.resolveCommand('105', { flightNumber: 'AI645', origin: 'BOM', destination: 'DEL' });
  assert(
    res105.valid === true && res105.redirectUrl.includes('/navigation?flight=AI645&from=BOM&to=DEL'),
    'Code 105 constructs verified navigation route'
  );

  // Test 9: Code 106 (Crisis & Airspace Alerts) routes to /alerts
  const res106 = await quickHelpService.resolveCommand('106');
  assert(
    res106.valid === true && res106.redirectUrl === '/alerts',
    'Code 106 routes to /alerts'
  );

  // Test 10: Code 107 (Ask AI Assistant) routes to /assistant
  const res107 = await quickHelpService.resolveCommand('107', { question: 'What is my compensation under DGCA?' });
  assert(
    res107.valid === true && res107.redirectUrl === '/assistant' && res107.navigationState.initialQuestion.includes('DGCA'),
    'Code 107 routes to /assistant with passenger question'
  );

  // Test 11: Code 108 (Check Flight Status)
  const res108 = await quickHelpService.resolveCommand('108', { flightNumber: 'BA142' });
  assert(
    res108.valid === true && res108.redirectUrl === '/flight/BA142',
    'Code 108 routes to /flight/BA142'
  );

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
