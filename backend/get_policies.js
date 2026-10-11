require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getPolicies() {
  const { data, error } = await supabase.from('pg_policies').select('*').eq('schemaname', 'public').eq('tablename', 'saved_trips');
  if (error) {
    console.error("Error fetching policies:", error);
  } else {
    console.log("Policies on saved_trips:");
    console.log(data);
  }
}

getPolicies();
