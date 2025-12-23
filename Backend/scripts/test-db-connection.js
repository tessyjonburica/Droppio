/**
 * Test Supabase database connection
 * Run with: node scripts/test-db-connection.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('\n=== Testing Supabase Connection ===\n');

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is not set in .env');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY is not set in .env');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...`);
console.log(`   Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
console.log(`   Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

// Test service role client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  console.log('Testing service role connection...\n');

  // Test 1: Check if users table exists
  console.log('1. Checking if users table exists...');
  const { data: tableCheck, error: tableError } = await supabaseAdmin
    .from('users')
    .select('id')
    .limit(1);

  if (tableError) {
    if (tableError.code === 'PGRST116') {
      console.log('   ✅ Table exists (no rows found, which is OK)');
    } else if (tableError.message?.includes('permission denied')) {
      console.error('   ❌ Permission denied!');
      console.error(`   Error: ${tableError.message}`);
      console.error('\n   Possible fixes:');
      console.error('   1. Run migration: 003_disable_rls_completely.sql');
      console.error('   2. Check SUPABASE_SERVICE_ROLE_KEY is correct');
      console.error('   3. Verify you copied the service_role key (not anon key)');
      return false;
    } else if (tableError.message?.includes('relation') && tableError.message?.includes('does not exist')) {
      console.error('   ❌ Table does not exist!');
      console.error('   Run migration: 001_initial_schema.sql first');
      return false;
    } else {
      console.error(`   ❌ Error: ${tableError.message}`);
      return false;
    }
  } else {
    console.log('   ✅ Table exists and is accessible');
  }

  // Test 2: Try to insert a test record (then delete it)
  console.log('\n2. Testing INSERT permission...');
  const testWallet = `test_${Date.now()}@test.com`;
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      wallet_address: testWallet,
      role: 'viewer',
    })
    .select()
    .single();

  if (insertError) {
    console.error(`   ❌ Insert failed: ${insertError.message}`);
    if (insertError.message?.includes('permission denied')) {
      console.error('   RLS is still blocking access. Run migration: 003_disable_rls_completely.sql');
    }
    return false;
  } else {
    console.log('   ✅ INSERT works');
    
    // Clean up test record
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('wallet_address', testWallet);
    console.log('   ✅ Test record cleaned up');
  }

  // Test 3: Check role constraint
  console.log('\n3. Testing role constraint...');
  const { error: roleError } = await supabaseAdmin
    .from('users')
    .insert({
      wallet_address: `test_role_${Date.now()}@test.com`,
      role: 'creator', // Test if 'creator' is allowed
    })
    .select()
    .single();

  if (roleError) {
    if (roleError.message?.includes('check constraint') || roleError.message?.includes('violates')) {
      console.error('   ❌ Role constraint error!');
      console.error(`   Error: ${roleError.message}`);
      console.error('   Run migration: 003_disable_rls_completely.sql to fix role constraint');
      return false;
    } else {
      console.error(`   ❌ Unexpected error: ${roleError.message}`);
      return false;
    }
  } else {
    console.log('   ✅ Role constraint allows "creator"');
    // Clean up
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('wallet_address', `test_role_${Date.now()}@test.com`);
  }

  console.log('\n✅ All tests passed! Database is configured correctly.\n');
  return true;
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  });

