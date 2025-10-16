import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { isAdmin } from "../_shared/admin-check.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RemoveAdminSchema = z.object({
  roleId: z.string().uuid(),
});

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

    // Parse and validate input
    const body = await req.json();
    const validation = RemoveAdminSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid role ID format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { roleId } = validation.data;

    // Get role details before deletion for logging
    const { data: role, error: roleQueryError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("id", roleId)
      .single();

    if (roleQueryError || !role) {
      return new Response(
        JSON.stringify({ error: "Role not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Remove admin role
    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("id", roleId);

    if (deleteError) {
      console.error("Error removing admin role:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to remove admin role" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log admin action
    await supabaseAdmin.from("admin_actions").insert({
      admin_id: userData.user.id,
      target_user_id: role.user_id,
      action_type: "remove_admin",
      details: { roleId },
    });

    console.log(`Admin ${userData.user.id} removed admin role ${roleId} from user ${role.user_id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Admin user removed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in remove-admin function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to remove admin user" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
