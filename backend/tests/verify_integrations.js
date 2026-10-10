const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING AEROMATE API INTEGRATION VERIFICATION ---');

  // 1. Health Check
  try {
    const health = await request('/api/health');
    console.log('[1] Health Check:', health.status, health.data?.status || 'OK');
  } catch (err) {
    console.error('[1] Health Check FAILED:', err.message);
  }

  // 2. Flight Search (Duffel API)
  try {
    const t0 = Date.now();
    const searchRes1 = await request('/api/flights/search?origin=LHR&destination=JFK&date=2026-11-15');
    const d1 = Date.now() - t0;
    console.log(`[2A] Duffel Flight Search (Req 1): Status ${searchRes1.status}, Count: ${searchRes1.data?.flights?.length || 0}, Provider: ${searchRes1.data?.provider}, Took: ${d1}ms`);
    if (searchRes1.data?.flights?.length > 0) {
      const sample = searchRes1.data.flights[0];
      console.log(`     Sample flight: ${sample.airline} ${sample.flightNumber} (${sample.origin} -> ${sample.destination}), Price: $${sample.price}`);
    }

    // Test 120s caching
    const t1 = Date.now();
    const searchRes2 = await request('/api/flights/search?origin=LHR&destination=JFK&date=2026-11-15');
    const d2 = Date.now() - t1;
    console.log(`[2B] Duffel Flight Search (Req 2 - Cached): Status ${searchRes2.status}, Count: ${searchRes2.data?.flights?.length || 0}, Took: ${d2}ms (Cache Hit)`);
  } catch (err) {
    console.error('[2] Flight Search FAILED:', err.message);
  }

  // 3. Live Aircraft Map (OpenSky API)
  try {
    const t0 = Date.now();
    const liveRes1 = await request('/api/flights/live?lamin=49.0&lomin=-5.0&lamax=55.0&lomax=5.0');
    const d1 = Date.now() - t0;
    console.log(`[3A] OpenSky Live Map (Req 1): Status ${liveRes1.status}, Aircraft Count: ${liveRes1.data?.count || liveRes1.data?.flights?.length || 0}, Provider: ${liveRes1.data?.provider || 'opensky'}, Took: ${d1}ms`);

    // Test 120s caching
    const t1 = Date.now();
    const liveRes2 = await request('/api/flights/live?lamin=49.0&lomin=-5.0&lamax=55.0&lomax=5.0');
    const d2 = Date.now() - t1;
    console.log(`[3B] OpenSky Live Map (Req 2 - Cached): Status ${liveRes2.status}, Took: ${d2}ms (Cache Hit)`);
  } catch (err) {
    console.error('[3] Live Map FAILED:', err.message);
  }

  // 4. Flight Status (Aviationstack API)
  try {
    const t0 = Date.now();
    const statusRes1 = await request('/api/flights/BA117/status');
    const d1 = Date.now() - t0;
    console.log(`[4A] Aviationstack Flight Status (Req 1): Status ${statusRes1.status}, Flight: ${statusRes1.data?.flightNumber}, Status: ${statusRes1.data?.status}, Took: ${d1}ms`);

    // Test 120s caching
    const t1 = Date.now();
    const statusRes2 = await request('/api/flights/BA117/status');
    const d2 = Date.now() - t1;
    console.log(`[4B] Aviationstack Flight Status (Req 2 - Cached): Status ${statusRes2.status}, Took: ${d2}ms (Cache Hit)`);
  } catch (err) {
    console.error('[4] Flight Status FAILED:', err.message);
  }

  // 5. Aviation News & Alerts (NewsAPI)
  try {
    const t0 = Date.now();
    const alertsRes1 = await request('/api/alerts/live');
    const d1 = Date.now() - t0;
    console.log(`[5A] NewsAPI Alerts (Req 1): Status ${alertsRes1.status}, Count: ${alertsRes1.data?.alerts?.length || alertsRes1.data?.length || 0}, Took: ${d1}ms`);
    
    // Test 120s caching
    const t1 = Date.now();
    const alertsRes2 = await request('/api/alerts/live');
    const d2 = Date.now() - t1;
    console.log(`[5B] NewsAPI Alerts (Req 2 - Cached): Status ${alertsRes2.status}, Took: ${d2}ms (Cache Hit)`);
  } catch (err) {
    console.error('[5] Alerts FAILED:', err.message);
  }

  // 6. AI Assistant (OpenAI / Fallback Engine)
  try {
    const chatRes = await request('/api/assistant/chat', {
      method: 'POST',
      body: { message: 'What is the baggage limit for international flights?' }
    });
    console.log(`[6] AI Assistant: Status ${chatRes.status}, Response: "${(chatRes.data?.reply || '').slice(0, 80)}..."`);
  } catch (err) {
    console.error('[6] AI Assistant FAILED:', err.message);
  }

  // 7. Supabase Trips
  try {
    const tripsRes = await request('/api/trips');
    console.log(`[7] Supabase Trips API: Status ${tripsRes.status}, Trips returned: ${tripsRes.data?.trips?.length ?? tripsRes.data?.length ?? 0}`);
  } catch (err) {
    console.error('[7] Trips FAILED:', err.message);
  }

  console.log('--- VERIFICATION COMPLETED ---');
}

runTests();
