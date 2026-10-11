require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRLS() {
  console.log("Testing RLS Isolation...");
  const email1 = `test_admin1_${Date.now()}@aeromate.io`;
  const email2 = `test_admin2_${Date.now()}@aeromate.io`;
  const password = "Password123!@#";

  // 1. Create two test users via Admin API
  const { data: user1Data, error: err1 } = await supabaseAdmin.auth.admin.createUser({
    email: email1,
    password: password,
    email_confirm: true
  });
  if (err1) {
    console.error("User 1 Creation Failed:", err1.message);
    return;
  }
  const user1 = user1Data.user;
  console.log("✅ User 1 Created:", user1.id);

  const { data: user2Data, error: err2 } = await supabaseAdmin.auth.admin.createUser({
    email: email2,
    password: password,
    email_confirm: true
  });
  if (err2) {
    console.error("User 2 Creation Failed:", err2.message);
    return;
  }
  const user2 = user2Data.user;
  console.log("✅ User 2 Created:", user2.id);

  // 2. Sign in as User 1 and User 2 to get Anon clients
  const supabase1 = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  await supabase1.auth.signInWithPassword({ email: email1, password });

  const supabase2 = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  await supabase2.auth.signInWithPassword({ email: email2, password });

  // 3. User 1 inserts a trip
  const { data: tripData, error: tripErr } = await supabase1.from('saved_trips').insert([{
    user_id: user1.id,
    flight_number: 'TEST123',
    origin: 'JFK',
    destination: 'LAX',
    travel_date: '2026-11-01'
  }]).select().single();

  if (tripErr) {
    console.error("❌ User 1 Trip Insert Failed:", tripErr.message);
  } else {
    console.log("✅ User 1 Trip Inserted:", tripData.id);
  }

  // 4. User 2 tries to read trips
  const { data: readData, error: readErr } = await supabase2.from('saved_trips').select('*');
  if (readErr) {
    console.error("User 2 Read Error:", readErr.message);
  } else {
    if (readData.length === 0) {
      console.log("✅ User 2 read zero trips (RLS isolation successful).");
    } else {
      console.error("❌ User 2 read trips! Isolation failed.", readData);
    }
  }

  // 5. User 2 tries to update User 1's trip
  if (tripData) {
    const { data: updateData, error: updateErr } = await supabase2.from('saved_trips')
      .update({ flight_number: 'HACKED' })
      .eq('id', tripData.id)
      .select();

    if (updateErr) {
      console.log("✅ User 2 update blocked/errored (RLS isolation successful).");
    } else if (updateData.length === 0) {
      console.log("✅ User 2 update returned no rows (RLS isolation successful).");
    } else {
      console.error("❌ User 2 successfully updated User 1's trip!", updateData);
    }
  }

  // Cleanup
  await supabaseAdmin.auth.admin.deleteUser(user1.id);
  await supabaseAdmin.auth.admin.deleteUser(user2.id);
  console.log("Cleanup completed.");
}

testRLS();
