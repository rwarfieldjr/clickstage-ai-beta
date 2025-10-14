import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { stripePaymentId, credits, userId } = await req.json();

    if (!stripePaymentId || !credits || !userId) {
      throw new Error("Missing required parameters");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Add credits to user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    const newCredits = (profile.credits || 0) + credits;

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
        amount: credits,
        transaction_type: "purchase",
        stripe_payment_id: stripePaymentId,
        description: `Purchased ${credits} photo credits`,
      });

    if (transactionError) throw transactionError;

    console.log(`Added ${credits} credits to user ${userId}. New balance: ${newCredits}`);

    return new Response(
      JSON.stringify({ success: true, newBalance: newCredits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error adding credits:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
