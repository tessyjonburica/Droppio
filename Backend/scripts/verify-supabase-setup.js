/**
 * Comprehensive Supabase setup verification
 * Run: node scripts/verify-supabase-setup.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('\n🔍 Supabase Setup Verification\n');
console.log('='.repeat(50));

// Check environment variables
console.log('\n1. Checking environment variables...');
if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is missing');
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
  process.exit(1);
}
if (!SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY is missing');
  process.exit(1);
}

console.log('✅ SUPABASE_URL:', SUPABASE_URL.substring(0, 30) + '...');
console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
console.log('✅ SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

// Create clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
  let allPassed = true;

  // Test 1: Service role SELECT
  console.log('\n2. Testing service role SELECT...');
  const { data: selectData, error: selectError } = await supabaseAdmin
    .from('users')
    .select('id')
    .limit(1);

  if (selectError) {
    console.error('❌ SELECT failed:', selectError.message);
    console.error('   Code:', selectError.code);
    console.error('   Details:', selectError.details);
    allPassed = false;
  } else {
    console.log('✅ SELECT works');
  }

  // Test 2: Service role INSERT
  console.log('\n3. Testing service role INSERT...');
  const testWallet = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      wallet_address: testWallet,
      role: 'viewer',
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ INSERT failed:', insertError.message);
    console.error('   Code:', insertError.code);
    console.error('   Details:', insertError.details);
    if (insertError.message?.includes('permission denied')) {
      console.error('\n   💡 SOLUTION: Run FINAL_FIX.sql in Supabase SQL Editor');
    }
    allPassed = false;
  } else {
    console.log('✅ INSERT works');
    
    // Clean up
    await supabaseAdmin.from('users').delete().eq('wallet_address', testWallet);
    console.log('✅ Test record cleaned up');
  }

  // Test 3: Service role UPDATE
  console.log('\n4. Testing service role UPDATE...');
  const testWallet2 = `test_update_${Date.now()}`;
  const { data: insertData2 } = await supabaseAdmin
    .from('users')
    .insert({ wallet_address: testWallet2, role: 'viewer' })
    .select()
    .single();

  if (insertData2) {
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: 'creator' })
      .eq('wallet_address', testWallet2);

    if (updateError) {
      console.error('❌ UPDATE failed:', updateError.message);
      allPassed = false;
    } else {
      console.log('✅ UPDATE works');
    }
    
    // Clean up
    await supabaseAdmin.from('users').delete().eq('wallet_address', testWallet2);
  }

  // Test 4: Check RLS status (skip - requires direct DB access)
  console.log('\n5. Checking RLS status...');
  console.log('   (RLS check requires direct database access - skipping)');

  // Test 5: Anon key (should fail if RLS is working)
  console.log('\n6. Testing anon key (should work if RLS is disabled)...');
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('users')
    .select('id')
    .limit(1);

  if (anonError && anonError.message?.includes('permission denied')) {
    console.log('⚠️  Anon key blocked (this is expected if RLS is enabled)');
  } else {
    console.log('✅ Anon key can read (RLS is disabled)');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('Your Supabase setup is working correctly.\n');
    return true;
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('\nNext steps:');
    console.log('1. Run 000_FRESH_START.sql in Supabase SQL Editor (this will fix permissions)');
    console.log('2. Verify SUPABASE_SERVICE_ROLE_KEY in .env matches Supabase Dashboard');
    console.log('3. Check Supabase Dashboard → Settings → API → service_role key');
    console.log('4. Make sure you ran the migration AFTER creating tables\n');
    return false;
  }
}

runTests()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('\n❌ Test script error:', error);
    process.exit(1);
  });

