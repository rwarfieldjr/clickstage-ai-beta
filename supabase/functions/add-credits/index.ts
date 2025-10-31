import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema - userId removed, will use JWT identity
const AddCreditsSchema = z.object({
  stripePaymentId: z.string().min(1).max(200),
  credits: z.number().int().positive().max(10000),
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

    const { stripePaymentId, credits } = validation.data;

    // Use userId from authenticated JWT only - never from request body
    const userId = userData.user.id;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Use atomic credit update system
    const { data, error } = await supabaseAdmin.rpc("update_user_credits_atomic", {
      p_user_id: userId,
      p_delta: credits,
      p_reason: "purchase",
      p_order_id: null,
    });

    if (error) {
      console.error('RPC error:', error);
      throw new Error(`Failed to add credits: ${error.message}`);
    }

    const result = Array.isArray(data) ? data[0] : data;
    
    if (!result || !result.ok) {
      throw new Error(result?.message || "Failed to add credits");
    }

    const newCredits = result.balance;
    console.log(`Added ${credits} credits to user ${userId}. New balance: ${newCredits}`);

    return new Response(
      JSON.stringify({ success: true, newBalance: newCredits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error adding credits:", error);
    
    // Return sanitized error to client
    const clientError = error?.message?.includes('validation')
      ? error.message
      : 'Failed to add credits. Please try again.';
    
    return new Response(
      JSON.stringify({ error: clientError }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
