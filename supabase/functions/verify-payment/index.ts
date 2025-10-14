import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ success: false, message: "Payment not completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const userId = session.metadata?.user_id;
    const photosCount = session.metadata?.photos_count ? parseInt(session.metadata.photos_count) : 0;

    if (!userId || !photosCount) {
      throw new Error("Missing user ID or photos count in session metadata");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get current credits
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    const newCredits = (profile.credits || 0) + photosCount;

    // Update credits
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: transactionError } = await supabaseAdmin
      .from("credits_transactions")
      .insert({
        user_id: userId,
        amount: photosCount,
        transaction_type: "purchase",
        stripe_payment_id: session.payment_intent as string,
        description: `Purchased ${photosCount} photo credits`,
      });

    if (transactionError) throw transactionError;

    console.log(`Added ${photosCount} credits to user ${userId}. New balance: ${newCredits}`);

    return new Response(
      JSON.stringify({ success: true, credits: newCredits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
