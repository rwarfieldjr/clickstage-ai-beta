import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UpdateEmailSchema = z.object({
  userId: z.string().uuid(),
  newEmail: z.string().email().max(255),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const validation = UpdateEmailSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid user ID or email format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { userId, newEmail } = validation.data;

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update user email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );

    if (error) {
      console.error("Error updating user email:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update email", details: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Also update the profiles table if it exists
    await supabaseAdmin
      .from("profiles")
      .update({ email: newEmail })
      .eq("id", userId);

    console.log(`Updated email for user ${userId} to ${newEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email updated successfully",
        newEmail: data.user.email
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in update-admin-email function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update email" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
