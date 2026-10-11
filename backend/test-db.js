require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAuth() {
  console.log("Testing Auth...");
  const email1 = `test1_${Date.now()}@example.com`;
  const email2 = `test2_${Date.now()}@example.com`;
  const password = "Password123!";

  // 1. Sign up user 1
  const { data: user1, error: err1 } = await supabase.auth.signUp({ email: email1, password });
  if (err1) {
    console.error("User 1 Signup Failed:", err1.message);
    return;
  }
  console.log("User 1 Signed up:", user1.user.id);

  // 2. Sign up user 2
  const { data: user2, error: err2 } = await supabase.auth.signUp({ email: email2, password });
  if (err2) {
    console.error("User 2 Signup Failed:", err2.message);
    return;
  }
  console.log("User 2 Signed up:", user2.user.id);

  // 3. Test Trips CRUD
  const { data: insertData, error: insertErr } = await supabase
    .from('saved_trips')
    .insert([{
      user_id: user1.user.id,
      flight_number: 'TEST123',
      origin: 'JFK',
      destination: 'LAX',
      travel_date: '2026-11-01'
    }])
    .select();
  
  if (insertErr) {
    console.error("Insert Trip Failed (Schema might not be applied):", insertErr.message);
  } else {
    console.log("Insert Trip Success:", insertData);
  }
  
  // Test RLS by trying to read from User 2
  const supabaseUser2 = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  await supabaseUser2.auth.signInWithPassword({ email: email2, password });
  const { data: readData, error: readErr } = await supabaseUser2.from('saved_trips').select('*');
  
  if (readErr) {
    console.error("Read Trips Error:", readErr.message);
  } else {
    console.log("User 2 reads trips (should be empty):", readData);
  }
}

testAuth();
