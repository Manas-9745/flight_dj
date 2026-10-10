const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseAdmin = null;

const isPlaceholder = (val) => !val || val.includes('your-') || val.includes('placeholder');
const isConfigured = !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_ANON_KEY is missing or placeholder. Database operations will use mock fallback.');
}

if (!isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseServiceKey)) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
}

module.exports = {
  supabase,
  supabaseAdmin,
  isConfigured
};
