// @version: stable-credits-2.0 | ✅ UPDATED: Now uses user_id system (2025-11-04)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting credit sync process...");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch recent checkout sessions (last 30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: thirtyDaysAgo },
    });

    console.log(`Found ${sessions.data.length} sessions to process`);

    let syncedCount = 0;
    let skippedCount = 0;
    const syncedUsers: string[] = [];

    for (const session of sessions.data) {
      // Only process completed sessions
      if (session.payment_status !== "paid") {
        skippedCount++;
        continue;
      }

      const email = session.customer_email || session.customer_details?.email;
      const photoCount = Number(session.metadata?.photos_count || session.metadata?.photo_count || 0);

      if (!email || photoCount === 0) {
        skippedCount++;
        continue;
      }

      console.log(`Processing session ${session.id} for ${email} with ${photoCount} photos`);

      // Get user_id from profiles
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (!profile) {
        console.warn(`No profile found for ${email}, skipping`);
        skippedCount++;
        continue;
      }

      // Get current credits from NEW user_credits table (user_id-based)
      const { data: creditsData } = await supabaseAdmin
        .from("user_credits")
        .select("credits")
        .eq("user_id", profile.id)
        .single();

      const currentBalance = creditsData?.credits || 0;

      // Check if this session has already been processed
      const { data: processedSession } = await supabaseAdmin
        .from("processed_stripe_sessions")
        .select("id")
        .eq("session_id", session.id)
        .single();

      if (processedSession) {
        console.log(`Session ${session.id} already processed, skipping`);
        skippedCount++;
        continue;
      }

      // Add credits using the NEW atomic RPC (user_id-based)
      console.log(`Current balance for ${email} (user ${profile.id}): ${currentBalance}`);
      
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('update_user_credits_atomic', {
        p_user_id: profile.id,
        p_delta: photoCount,
        p_reason: `Sync from Stripe session ${session.id}`,
        p_order_id: null
      });

      if (rpcError) {
        console.error(`Error syncing credits for ${email}:`, rpcError);
        continue;
      }

      const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
      if (!row?.ok) {
        console.error(`Failed to sync credits for ${email}:`, row?.message);
        continue;
      }

      console.log(`✓ Synced ${photoCount} credits for ${email}. New balance: ${row.balance}`);
      syncedCount++;
      syncedUsers.push(email);
    }

    const result = {
      status: "Sync complete",
      sessionsProcessed: sessions.data.length,
      creditsSynced: syncedCount,
      skipped: skippedCount,
      syncedUsers,
      timestamp: new Date().toISOString(),
    };

    console.log("Sync complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Credit sync error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: "Sync failed",
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
