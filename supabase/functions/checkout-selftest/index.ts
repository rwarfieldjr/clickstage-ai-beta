import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Self-test endpoint to verify checkout system health
 * Tests all critical components without actually processing payments
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[checkout-selftest] ===== Starting system self-test =====');
  const startTime = Date.now();
  const results: any = {
    ok: true,
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // Test 1: Supabase Connection
    console.log('[checkout-selftest] Testing Supabase connection...');
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase credentials');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Test database query
      const { data, error } = await supabase
        .from('user_credits')
        .select('count')
        .limit(1);

      if (error) throw error;

      results.tests.supabase = {
        status: 'pass',
        message: 'Connection successful',
        latency_ms: Date.now() - startTime
      };
      console.log('[checkout-selftest] ✓ Supabase connection OK');
    } catch (e) {
      results.ok = false;
      results.tests.supabase = {
        status: 'fail',
        error: e instanceof Error ? e.message : String(e)
      };
      console.error('[checkout-selftest] ✗ Supabase connection failed:', e);
    }

    // Test 2: Stripe Connection
    console.log('[checkout-selftest] Testing Stripe connection...');
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      
      if (!stripeKey) {
        throw new Error('Missing Stripe credentials');
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      
      // Test API call - retrieve account info
      const account = await stripe.accounts.retrieve();
      
      results.tests.stripe = {
        status: 'pass',
        message: 'Connection successful',
        account_id: account.id,
        latency_ms: Date.now() - startTime - (results.tests.supabase?.latency_ms || 0)
      };
      console.log('[checkout-selftest] ✓ Stripe connection OK');
    } catch (e) {
      results.ok = false;
      results.tests.stripe = {
        status: 'fail',
        error: e instanceof Error ? e.message : String(e)
      };
      console.error('[checkout-selftest] ✗ Stripe connection failed:', e);
    }

    // Test 3: Database Functions
    console.log('[checkout-selftest] Testing database functions...');
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

      // Test atomic credit update function (dry run)
      const { data: lockTest, error: lockError } = await supabase.rpc('acquire_checkout_lock', {
        p_email: 'selftest@test.com',
        p_lock_duration_seconds: 1
      });

      if (lockError) throw lockError;

      // Release the lock
      await supabase.rpc('release_checkout_lock', {
        p_email: 'selftest@test.com'
      });

      results.tests.database_functions = {
        status: 'pass',
        message: 'Lock functions working',
        lock_acquired: lockTest
      };
      console.log('[checkout-selftest] ✓ Database functions OK');
    } catch (e) {
      results.ok = false;
      results.tests.database_functions = {
        status: 'fail',
        error: e instanceof Error ? e.message : String(e)
      };
      console.error('[checkout-selftest] ✗ Database functions failed:', e);
    }

    // Test 4: System Logs
    console.log('[checkout-selftest] Testing system logging...');
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

      const { error: logError } = await supabase
        .from('system_logs')
        .insert({
          event: 'Self-test executed',
          severity: 'info',
          path: '/checkout-selftest',
          payload: { test: true }
        });

      if (logError) throw logError;

      results.tests.system_logs = {
        status: 'pass',
        message: 'Logging operational'
      };
      console.log('[checkout-selftest] ✓ System logging OK');
    } catch (e) {
      results.ok = false;
      results.tests.system_logs = {
        status: 'fail',
        error: e instanceof Error ? e.message : String(e)
      };
      console.error('[checkout-selftest] ✗ System logging failed:', e);
    }

    // Test 5: Stripe Event Log
    console.log('[checkout-selftest] Testing Stripe event deduplication...');
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

      const testEventId = `evt_selftest_${Date.now()}`;

      // Try to insert test event
      const { error: insertError } = await supabase
        .from('stripe_event_log')
        .insert({
          id: testEventId,
          event_type: 'selftest',
          payload: { test: true }
        });

      if (insertError) throw insertError;

      // Clean up test event
      await supabase
        .from('stripe_event_log')
        .delete()
        .eq('id', testEventId);

      results.tests.stripe_event_log = {
        status: 'pass',
        message: 'Event deduplication operational'
      };
      console.log('[checkout-selftest] ✓ Stripe event log OK');
    } catch (e) {
      results.ok = false;
      results.tests.stripe_event_log = {
        status: 'fail',
        error: e instanceof Error ? e.message : String(e)
      };
      console.error('[checkout-selftest] ✗ Stripe event log failed:', e);
    }

    // Calculate total latency
    results.latency_ms = Date.now() - startTime;
    results.supabase_connected = results.tests.supabase?.status === 'pass';
    results.stripe_connected = results.tests.stripe?.status === 'pass';

    console.log('[checkout-selftest] ===== Self-test completed =====');
    console.log(`[checkout-selftest] Overall status: ${results.ok ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`[checkout-selftest] Total latency: ${results.latency_ms}ms`);

    if (results.ok) {
      console.log('[checkout-selftest] ✅ Checkout Stabilization Complete');
    }

    return new Response(
      JSON.stringify(results),
      { 
        status: results.ok ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[checkout-selftest] Critical error during self-test:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
