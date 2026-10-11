require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log("Checking if tables exist using service role key...");

  const tables = ['profiles', 'passengers', 'bookings', 'notification_preferences', 'notification_history'];
  let allExist = true;

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    
    if (error && error.code === 'PGRST204' || error && error.code === '42P01') {
      console.error(`❌ Table '${table}' does not exist (Error ${error.code}: ${error.message})`);
      allExist = false;
    } else if (error) {
       console.error(`⚠️ Error querying table '${table}': ${error.code} - ${error.message}`);
       // Note: PGRST116 means no rows but table exists, which is fine, but we used limit(1) so it returns empty array not error, unless single() is used.
    } else {
      console.log(`✅ Table '${table}' exists.`);
    }
  }

  if (allExist) {
    console.log("All required tables exist.");
  } else {
    console.log("Some tables are missing. Please run the schema.sql in Supabase Dashboard.");
  }
}

checkDatabase();
