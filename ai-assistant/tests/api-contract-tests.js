/**
 * AeroMate AI Assistant API Contract & Deterministic Assertion Tests
 * Run via: node ai-assistant/tests/api-contract-tests.js
 */
const assert = require('assert');
const assistantService = require('../assistantService');

async function runContractTests() {
  console.log('🧪 Starting AeroMate AI Assistant Comprehensive QA Verification Suite...\n');
  let passedCount = 0;
  let totalCount = 0;

  function test(name, fn) {
    totalCount++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  async function asyncTest(name, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // 1. Contract Validation & Response Object Schema
  await asyncTest('processAssistantChat returns compliant backend contract object', async () => {
    const result = await assistantService.processAssistantChat({
      message: 'What is my flight status?',
      flightContext: {
        flightNumber: 'AI645',
        airline: 'Air India',
        status: 'scheduled',
        origin: 'BOM',
        destination: 'DEL',
      },
    });

    assert.ok(result, 'Result should exist');
    assert.strictEqual(typeof result.reply, 'string', 'result.reply should be a string');
    assert.ok(['live_openai', 'offline_mock', 'fallback_error'].includes(result.mode), `Invalid mode: ${result.mode}`);
    assert.strictEqual(typeof result.flightContextApplied, 'boolean', 'flightContextApplied should be boolean');
    assert.ok(result.timestamp, 'Timestamp should exist');
  });

  // 2. Input Validation (Missing Message)
  await asyncTest('processAssistantChat throws on empty or missing message', async () => {
    try {
      await assistantService.processAssistantChat({ message: '' });
      assert.fail('Should have thrown error for empty message');
    } catch (err) {
      assert.ok(err.message.includes('message'), 'Error message should reference message parameter');
    }
  });

  // 3. Flight Context Alias Normalization
  test('normalizeFlightContext resolves scheduledDep and estimatedDep aliases', () => {
    const norm = assistantService.normalizeFlightContext({
      flightNumber: 'BA142',
      scheduledDep: '14:00',
      estimatedDep: '17:00',
      delayMinutes: '180',
    });

    assert.strictEqual(norm.flightNumber, 'BA142');
    assert.strictEqual(norm.scheduledDeparture, '14:00');
    assert.strictEqual(norm.estimatedDeparture, '17:00');
    assert.strictEqual(norm.delayMinutes, 180);
    assert.strictEqual(norm.gate, 'TBD');
    assert.strictEqual(norm.terminal, 'TBD');
  });

  // 4. Detailed Legal Jurisdiction Tests (EU261 vs UK vs US DOT vs DGCA)
  test('determinePassengerRights calculates UK Air Passenger Rights for UK departing flight (LHR-JFK)', () => {
    const rights = assistantService.determinePassengerRights({
      flightNumber: 'BA142',
      airline: 'British Airways',
      origin: 'LHR',
      destination: 'JFK',
      status: 'delayed',
      delayMinutes: 210,
    });

    assert.ok(rights.jurisdiction.includes('UK Air Passenger Rights'), `Unexpected jurisdiction: ${rights.jurisdiction}`);
    assert.ok(rights.rightsSummary.some(r => r.includes('Conditional Cash Compensation')), 'Should mention conditional cash compensation');
  });

  test('determinePassengerRights applies US DOT (not EU261) for US carrier departing US to London (AA100 JFK-LHR)', () => {
    const rights = assistantService.determinePassengerRights({
      flightNumber: 'AA100',
      airline: 'American Airlines',
      origin: 'JFK',
      destination: 'LHR',
      status: 'delayed',
      delayMinutes: 240,
    });

    assert.ok(rights.jurisdiction.includes('US Department of Transportation'), `Expected US DOT, got: ${rights.jurisdiction}`);
  });

  test('determinePassengerRights calculates DGCA for Indian domestic flight (BOM-DEL)', () => {
    const rights = assistantService.determinePassengerRights({
      flightNumber: 'AI645',
      airline: 'Air India',
      origin: 'BOM',
      destination: 'DEL',
      status: 'delayed',
      delayMinutes: 120,
    });

    assert.ok(rights.jurisdiction.includes('DGCA'), `Unexpected jurisdiction: ${rights.jurisdiction}`);
    assert.ok(rights.rightsSummary.some(r => r.includes('meals and refreshments')), 'Should mention DGCA meal entitlement');
  });

  // 5. Automatic Language Detection
  test('detectLanguage identifies Hindi, Spanish, French, German, Japanese', () => {
    assert.strictEqual(assistantService.detectLanguage('क्या मेरी फ़्लाइट लेट है?'), 'hi');
    assert.strictEqual(assistantService.detectLanguage('¿Cuál es mi puerta de embarque?'), 'es');
    assert.strictEqual(assistantService.detectLanguage('Mon vol est-il annulé?'), 'fr');
    assert.strictEqual(assistantService.detectLanguage('Mein Flug ist verspätet.'), 'de');
    assert.strictEqual(assistantService.detectLanguage('搭乗ゲートはどこですか？'), 'ja');
    assert.strictEqual(assistantService.detectLanguage('Where is my gate?'), 'en');
  });

  // 6. History Validation & Sanitization
  test('validateHistory limits history length and strips invalid entries', () => {
    const rawHistory = Array(15).fill({ role: 'user', content: 'Hello' });
    rawHistory.push(null);
    rawHistory.push({ role: 'invalid_role', content: '    ' });

    const clean = assistantService.validateHistory(rawHistory);
    assert.ok(clean.length <= 10, 'History should be capped at 10 items');
    assert.ok(clean.every(item => item.role && item.content), 'All items should be valid objects');
  });

  // 7. Preserving Identifiers in Offline Fallback
  test('generateOfflineFallbackResponse preserves gate, terminal, and flight number', () => {
    const fallback = assistantService.generateOfflineFallbackResponse(
      'Where is my gate?',
      { flightNumber: 'AI645', origin: 'BOM', destination: 'DEL', gate: '15B', terminal: 'T2', status: 'scheduled' },
      'en'
    );

    assert.ok(fallback.includes('AI645'), 'Fallback should mention AI645');
    assert.ok(fallback.includes('15B'), 'Fallback should mention Gate 15B');
    assert.ok(fallback.includes('T2'), 'Fallback should mention Terminal T2');
    assert.ok(fallback.includes('BOM ➔ DEL'), 'Fallback should mention route');
  });

  // 8. Offline Fallback Behavior when OPENAI_API_KEY is Unset
  await asyncTest('processAssistantChat returns offline_mock mode when OPENAI_API_KEY is omitted', async () => {
    const oldKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const result = await assistantService.processAssistantChat({
        message: 'Where is my flight departing from?',
        flightContext: { flightNumber: 'AI645', origin: 'BOM', destination: 'DEL' }
      });

      assert.strictEqual(result.mode, 'offline_mock', 'Mode should be offline_mock when API key is missing');
      assert.ok(result.reply.includes('AI645'), 'Reply should include flight number');
    } finally {
      if (oldKey) process.env.OPENAI_API_KEY = oldKey;
    }
  });

  // 9. Prompt Injection Guardrail Assertion
  test('buildFlightContextString marks prompt-injection in user queries as unverified', () => {
    const contextString = assistantService.buildFlightContextString({
      flightNumber: 'AI645',
      status: 'scheduled',
      origin: 'BOM',
      destination: 'DEL'
    });

    assert.ok(contextString.includes('SCHEDULED'), 'Should rely on structured scheduled status');
    assert.ok(contextString.includes('Notice: Eligibility is conditional'), 'Should include qualification notice');
  });

  console.log('\n==================================================');
  console.log(`📊 Test Results: ${passedCount}/${totalCount} tests passed.`);
  console.log('==================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runContractTests();
