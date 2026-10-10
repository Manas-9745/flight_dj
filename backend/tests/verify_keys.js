require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const OpenAI = require('openai');

async function verifyAllKeys() {
  console.log(`
=============================================================
  🔑 AeroMate Live Credentials & Connection Verifier
=============================================================
`);

  let allGood = true;

  // 1. Check Supabase
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    console.log('⚪ [Supabase]: Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env (Using mock data)');
  } else {
    try {
      const sb = createClient(sbUrl, sbKey);
      const { data, error } = await sb.from('profiles').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        console.log(`⚠️ [Supabase Connected, but check schema]: ${error.message}`);
        console.log('   👉 Tip: Run backend/supabase/schema.sql in your Supabase SQL Editor.');
      } else {
        console.log('✅ [Supabase]: Successfully connected and verified!');
      }
    } catch (err) {
      console.log(`❌ [Supabase Connection Failed]: ${err.message}`);
      allGood = false;
    }
  }

  // 2. Check Amadeus
  const amadeusId = process.env.AMADEUS_CLIENT_ID;
  const amadeusSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!amadeusId || !amadeusSecret) {
    console.log('⚪ [Amadeus]: Missing AMADEUS_CLIENT_ID or AMADEUS_CLIENT_SECRET in .env (Using mock data)');
  } else {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', amadeusId);
      params.append('client_secret', amadeusSecret);

      const res = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (res.data?.access_token) {
        console.log('✅ [Amadeus API]: OAuth2 token successfully generated and verified!');
      }
    } catch (err) {
      console.log(`❌ [Amadeus API Error]: ${err.response?.data?.error_description || err.message}`);
      allGood = false;
    }
  }

  // 3. Check Aviationstack
  const avKey = process.env.AVIATIONSTACK_API_KEY;
  if (!avKey) {
    console.log('⚪ [Aviationstack]: Missing AVIATIONSTACK_API_KEY in .env (Using mock data)');
  } else {
    try {
      const res = await axios.get('http://api.aviationstack.com/v1/flights', {
        params: { access_key: avKey, limit: 1 },
        timeout: 5000
      });
      if (res.data?.error) {
        console.log(`❌ [Aviationstack Error]: ${res.data.error.message || res.data.error.info}`);
        allGood = false;
      } else {
        console.log('✅ [Aviationstack API]: Key verified successfully!');
      }
    } catch (err) {
      console.log(`❌ [Aviationstack Error]: ${err.message}`);
      allGood = false;
    }
  }

  // 4. Check OpenAI
  const oaiKey = process.env.OPENAI_API_KEY;
  if (!oaiKey) {
    console.log('⚪ [OpenAI Assistant]: Missing OPENAI_API_KEY in .env (Using mock data)');
  } else {
    try {
      const openai = new OpenAI({ apiKey: oaiKey });
      const models = await openai.models.list();
      if (models.data?.length) {
        console.log('✅ [OpenAI Assistant]: API Key verified successfully!');
      }
    } catch (err) {
      console.log(`❌ [OpenAI Error]: ${err.message}`);
      allGood = false;
    }
  }

  console.log(`
=============================================================
  Run 'npm run dev' to launch your backend server!
=============================================================
`);
}

verifyAllKeys();
