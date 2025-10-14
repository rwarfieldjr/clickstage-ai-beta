import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const AddCreditsSchema = z.object({
  stripePaymentId: z.string().min(1).max(200),
  credits: z.number().int().positive().max(10000),
  userId: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validation = AddCreditsSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input parameters", details: validation.error.format() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { stripePaymentId, credits, userId } = validation.data;

    // Verify authenticated user matches userId
    if (userData.user.id !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Cannot modify other users' credits" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
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
