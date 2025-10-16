import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { isAdmin } from "../_shared/admin-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin status
    const hasAdminRole = await isAdmin(userData.user.id, supabaseAdmin);
    if (!hasAdminRole) {
      console.error(`Unauthorized access attempt by user ${userData.user.id}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized - admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Fetch user data
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("name, email, phone, credits, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log admin action
    await supabaseAdmin.from("admin_actions").insert({
      admin_id: userData.user.id,
      action_type: "export_users",
      details: { userCount: data?.length || 0 },
    });

    console.log(`Admin ${userData.user.id} exported ${data?.length || 0} user records`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data || [],
        message: "User data exported successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in export-users function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to export user data" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
