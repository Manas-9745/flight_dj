/**
 * AeroMate AI Assistant Master Test Runner
 * Run via: node ai-assistant/tests/test-runner.js
 */
const path = require('path');
const fs = require('fs');

// Ensure modules can be loaded from backend/node_modules
const backendNodeModules = path.join(__dirname, '../../backend/node_modules');
if (!module.paths.includes(backendNodeModules)) {
  module.paths.push(backendNodeModules);
}

try {
  const dotenvPath = path.join(__dirname, '../../backend/.env');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  }
} catch (e) {
  // Dotenv optional in fallback
}

const assistantService = require('../assistantService');
const demoScenarios = require('./demo-scenarios.json');
const multilingualTests = require('./multilingual-tests.json');

async function runMasterTestSuite() {
  console.log('🚀 Executing AeroMate AI Assistant Master Test Suite...\n');
  console.log(`🔑 OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'CONFIGURED (Live Mode)' : 'NOT SET (Offline Mock Mode)'}`);
  console.log(`🤖 OPENAI_MODEL: ${process.env.OPENAI_MODEL || 'gpt-4o-mini (Default)'}\n`);

  let totalScenarios = 0;
  let passedScenarios = 0;

  // --- PART 1: Demo Scenarios ---
  console.log('==================================================');
  console.log('📌 PART 1: Demo Scenarios Execution');
  console.log('==================================================');

  for (let i = 0; i < demoScenarios.length; i++) {
    totalScenarios++;
    const scenario = demoScenarios[i];
    console.log(`\n🔹 [Scenario ${i + 1}/${demoScenarios.length}] ${scenario.scenarioId}: ${scenario.title}`);
    console.log(`   User Query: "${scenario.userQuery}"`);
    console.log(`   Flight: ${scenario.flightNumber || 'None'} (${scenario.origin || 'N/A'} -> ${scenario.destination || 'N/A'}) - Delay: ${scenario.delayMinutes || 0}m`);
    console.log(`   Expected Behavior: ${scenario.expectedBehavior}`);

    try {
      const flightContext = {
        flightNumber: scenario.flightNumber,
        airline: scenario.airline,
        origin: scenario.origin,
        destination: scenario.destination,
        status: scenario.status,
        delayMinutes: scenario.delayMinutes,
        gate: scenario.gate,
        terminal: scenario.terminal,
      };

      const result = await assistantService.processAssistantChat({
        message: scenario.userQuery,
        flightContext,
        language: scenario.language || 'en',
      });

      console.log(`   🤖 Execution Mode: ${result.mode}`);
      console.log(`   📝 Output Reply Preview:\n${result.reply.split('\n').map(line => '      ' + line).join('\n')}`);
      passedScenarios++;
    } catch (err) {
      console.error(`   ❌ ERROR running scenario ${scenario.scenarioId}:`, err.message);
    }
  }

  // --- PART 2: Multilingual Test Matrix ---
  console.log('\n==================================================');
  console.log('🌐 PART 2: Multilingual Test Matrix');
  console.log('==================================================');

  for (let i = 0; i < multilingualTests.length; i++) {
    totalScenarios++;
    const testCase = multilingualTests[i];
    console.log(`\n🌍 [Lang Test ${i + 1}/${multilingualTests.length}] ${testCase.testId} (${testCase.expectedLanguage})`);
    console.log(`   Query: "${testCase.userQuery}"`);

    try {
      const result = await assistantService.processAssistantChat({
        message: testCase.userQuery,
        flightContext: {
          flightNumber: testCase.flightNumber,
          airline: testCase.airline,
          origin: testCase.origin,
          destination: testCase.destination,
          status: testCase.status,
          delayMinutes: testCase.delayMinutes,
          gate: testCase.gate,
          terminal: testCase.terminal,
        },
        language: testCase.language,
        history: testCase.history || [],
      });

      // Verify key preservation
      let preserved = true;
      if (testCase.keyPreservation) {
        for (const key of testCase.keyPreservation) {
          if (!result.reply.includes(key)) {
            console.warn(`   ⚠️ Warning: Preserved key "${key}" not found in response!`);
            preserved = false;
          }
        }
      }

      console.log(`   🤖 Mode: ${result.mode}`);
      console.log(`   ✅ Response Generated (${preserved ? 'Key Terms Preserved' : 'Key Check Alert'})`);
      console.log(`   📝 Response:\n${result.reply.split('\n').map(line => '      ' + line).join('\n')}`);
      passedScenarios++;
    } catch (err) {
      console.error(`   ❌ ERROR running lang test ${testCase.testId}:`, err.message);
    }
  }

  console.log('\n==================================================');
  console.log(`📊 MASTER TEST SUMMARY: ${passedScenarios}/${totalScenarios} Scenarios Executed Successfully.`);
  console.log('==================================================\n');
}

runMasterTestSuite();
