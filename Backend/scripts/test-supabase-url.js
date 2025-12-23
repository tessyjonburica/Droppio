/**
 * Quick test to verify Supabase URL and keys are correct
 * Run: node scripts/test-supabase-url.js
 */

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('\n🔍 Supabase Configuration Check\n');
console.log('='.repeat(50));

// Check URL
console.log('\n1. SUPABASE_URL:');
if (!SUPABASE_URL) {
  console.error('   ❌ Missing!');
  process.exit(1);
}
console.log('   ✅ Found:', SUPABASE_URL);

if (!SUPABASE_URL.startsWith('https://')) {
  console.error('   ⚠️  WARNING: Should start with https://');
}

// Check if URL looks valid
if (!SUPABASE_URL.includes('.supabase.co')) {
  console.error('   ⚠️  WARNING: URL should contain .supabase.co');
}

// Check service role key
console.log('\n2. SUPABASE_SERVICE_ROLE_KEY:');
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('   ❌ Missing!');
  process.exit(1);
}
if (SUPABASE_SERVICE_ROLE_KEY.length < 100) {
  console.error('   ⚠️  WARNING: Key seems too short (should be 200+ chars)');
}
if (!SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
  console.error('   ⚠️  WARNING: Should start with eyJ (JWT format)');
}
console.log('   ✅ Found:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 30) + '...');

// Check anon key
console.log('\n3. SUPABASE_ANON_KEY:');
if (!SUPABASE_ANON_KEY) {
  console.error('   ⚠️  Missing (not critical for backend)');
} else {
  console.log('   ✅ Found:', SUPABASE_ANON_KEY.substring(0, 30) + '...');
}

// Test URL accessibility
console.log('\n4. Testing URL accessibility...');
const https = require('https');
const url = require('url');

const parsedUrl = new URL(SUPABASE_URL);
const options = {
  hostname: parsedUrl.hostname,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  },
  timeout: 5000,
};

const req = https.request(options, (res) => {
  console.log('   ✅ URL is accessible');
  console.log('   Status:', res.statusCode);
  res.on('data', () => {});
  res.on('end', () => {
    console.log('\n✅ All checks passed!\n');
  });
});

req.on('error', (error) => {
  console.error('   ❌ Cannot reach Supabase URL');
  console.error('   Error:', error.message);
  console.error('\n   Possible issues:');
  console.error('   1. SUPABASE_URL is incorrect');
  console.error('   2. Network connectivity problem');
  console.error('   3. Supabase project is paused or deleted');
  console.error('\n   Current URL:', SUPABASE_URL);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('   ❌ Connection timeout');
  req.destroy();
  process.exit(1);
});

req.end();

