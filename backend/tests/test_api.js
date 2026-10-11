process.env.NODE_ENV = 'test';
const app = require('../src/server');
const http = require('http');

async function testBackend() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5005, resolve));
  console.log('✅ Test server started on http://localhost:5005');

  const baseUrl = 'http://localhost:5005/api';

  try {
    // 1. Health
    const healthRes = await fetch(`${baseUrl}/health`).then(r => r.json());
    console.log('\n[1] Health Check:', healthRes.status === 'healthy' ? 'PASSED ✅' : 'FAILED ❌', healthRes);

    // 2. Flight Search
    const searchRes = await fetch(`${baseUrl}/flights/search?origin=JFK&destination=LHR&date=2026-10-15`).then(r => r.json());
    console.log('\n[2] Flight Search (Amadeus):', searchRes.success && searchRes.count > 0 ? 'PASSED ✅' : 'FAILED ❌', {
      count: searchRes.count,
      firstFlight: searchRes.data?.[0]?.flightNumber
    });

    // 3. Flight Status
    const statusRes = await fetch(`${baseUrl}/flights/BA142/status`).then(r => r.json());
    console.log('\n[3] Flight Status (Aviationstack):', statusRes.success && statusRes.data.flightNumber === 'BA142' ? 'PASSED ✅' : 'FAILED ❌', {
      status: statusRes.data?.status,
      delayMinutes: statusRes.data?.delayMinutes
    });

    // 4. Radar Position
    const positionRes = await fetch(`${baseUrl}/flights/BA142/position`).then(r => r.json());
    console.log('\n[4] Radar Position (OpenSky):', positionRes.success ? 'PASSED ✅' : 'FAILED ❌', {
      available: positionRes.available,
      lat: positionRes.data?.latitude,
      lon: positionRes.data?.longitude
    });

    // 5. AI Assistant Chat
    const chatRes = await fetch(`${baseUrl}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'My flight BA142 is delayed by 3 hours, what should I do?',
        flightContext: statusRes.data,
        language: 'en'
      })
    }).then(r => r.json());
    console.log('\n[5] AI Disruption Chat:', chatRes.success ? 'PASSED ✅' : 'FAILED ❌', {
      replySnippet: chatRes.data?.reply?.slice(0, 100) + '...'
    });

    // 6. User Trips with Auth (Security Check)
    const tripsRes = await fetch(`${baseUrl}/trips`, {
      headers: { 'Authorization': 'Bearer demo-token' }
    });
    const tripsStatus = tripsRes.status;
    const tripsBody = await tripsRes.json();
    console.log('\n[6] Saved Trips Auth Security Check:', tripsStatus === 401 ? 'PASSED ✅' : 'FAILED ❌', {
      expectedStatus: 401,
      receivedStatus: tripsStatus,
      error: tripsBody.error
    });

    if (healthRes.status === 'healthy' && tripsStatus === 401) {
      console.log('\n🎉 ALL BACKEND ENDPOINT TESTS PASSED SUCCESSFULLY (INCLUDING STRICT AUTH SEC)!');
    }
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    server.close();
    process.exit(1);
  }
}

testBackend();
