// @version: stable-credits-1.0 | Do not auto-modify | Core token system for ClickStagePro

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
    const syncedEmails: string[] = [];

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

      // Get current credits from user_credits table
      const { data: creditsData } = await supabaseAdmin
        .from("user_credits")
        .select("credits")
        .eq("email", email)
        .single();

      const currentBalance = creditsData?.credits || 0;

      // Check if this session has already been processed by looking at processed_stripe_sessions
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

      // Add credits if needed (this handles cases where webhook was missed)
      console.log(`Current balance for ${email}: ${currentBalance}, expected at least: ${photoCount}`);
      
      const newTotal = currentBalance + photoCount;
      
      const { error: upsertError } = await supabaseAdmin
        .from("user_credits")
        .upsert({ 
          email, 
          credits: newTotal,
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        console.error(`Error upserting credits for ${email}:`, upsertError);
        continue;
      }

      console.log(`Synced ${photoCount} credits for ${email}. New balance: ${newTotal}`);
      syncedCount++;
      syncedEmails.push(email);
    }

    const result = {
      status: "Sync complete",
      sessionsProcessed: sessions.data.length,
      creditsSynced: syncedCount,
      skipped: skippedCount,
      syncedEmails,
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
