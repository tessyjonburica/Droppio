import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from '../utils/logger';
import fetch from 'node-fetch';

// Validate service role key is set
if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.length < 20) {
  logger.error('SUPABASE_SERVICE_ROLE_KEY is missing or invalid. Database operations will fail.');
  logger.error('Please set SUPABASE_SERVICE_ROLE_KEY in your .env file.');
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: fetch as any,
  },
});

// Service role client for admin operations (use with caution)
// Service role bypasses RLS automatically in Supabase
// IMPORTANT: Use service_role key (not anon key) - found in Supabase Dashboard → Settings → API
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: fetch as any,
    },
  }
);

// Validate Supabase URL format
if (!env.SUPABASE_URL.startsWith('https://') && !env.SUPABASE_URL.startsWith('http://')) {
  logger.error('SUPABASE_URL must start with https:// or http://');
  logger.error('Current value:', env.SUPABASE_URL);
}

// Test service role connection on startup (development only)
if (process.env.NODE_ENV === 'development') {
  // Add a small delay to ensure env is loaded
  setTimeout(async () => {
    try {
      const { error } = await supabaseAdmin.from('users').select('id').limit(1);

      if (error) {
        logger.error('Service role connection test failed');
        logger.error('Error message:', error.message);
        logger.error('Error code:', error.code);
        logger.error('Error details:', error.details);
        logger.error('');
        logger.error('Possible causes:');
        logger.error('1. SUPABASE_URL is incorrect:', env.SUPABASE_URL);
        logger.error('2. SUPABASE_SERVICE_ROLE_KEY is incorrect or missing');
        logger.error('3. Network connectivity issue');
        logger.error('4. RLS policies are blocking access');
        logger.error('5. The users table does not exist');
        logger.error('');
        logger.error('SOLUTION:');
        logger.error('1. Verify SUPABASE_URL in .env matches your Supabase project URL');
        logger.error('2. Verify SUPABASE_SERVICE_ROLE_KEY is the service_role key (not anon key)');
        logger.error('3. Run migration 000_FRESH_START.sql in Supabase SQL Editor');
        logger.error('4. Test connection: node scripts/verify-supabase-setup.js');
      } else {
        logger.info('Service role connection test: OK');
      }
    } catch (err: any) {
      logger.error('Service role connection test error (network/fetch issue):');
      logger.error('Error type:', err.constructor.name);
      logger.error('Error message:', err.message);
      logger.error('Error stack:', err.stack);
      logger.error('');
      logger.error('This is usually a network/URL issue:');
      logger.error('1. Check SUPABASE_URL in .env:', env.SUPABASE_URL);
      logger.error('2. Verify the URL is accessible (should start with https://)');
      logger.error('3. Check your internet connection');
      logger.error('4. Verify Supabase project is active');
    }
  }, 1000); // 1 second delay
}

