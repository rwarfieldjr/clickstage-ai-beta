import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[purge-error-events] Starting purge of old error events");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[purge-error-events] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ ok: false, message: "Missing Supabase environment variables" }),
        { status: 500, headers: { "content-type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    });

    // Delete error events older than 30 days
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    console.log(`[purge-error-events] Deleting events older than ${cutoffDate}`);

    const { data, error, count } = await supabase
      .from("error_events")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate);

    if (error) {
      console.error("[purge-error-events] Delete failed:", error);
      return new Response(
        JSON.stringify({ ok: false, message: error.message }),
        { status: 500, headers: { "content-type": "application/json", ...corsHeaders } }
      );
    }

    const deletedCount = count ?? 0;
    console.log(`[purge-error-events] Successfully deleted ${deletedCount} old error events`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: `Deleted ${deletedCount} error events older than 30 days`,
        deletedCount,
        cutoffDate 
      }),
      { status: 200, headers: { "content-type": "application/json", ...corsHeaders } }
    );

  } catch (e: any) {
    console.error("[purge-error-events] Unexpected error:", e);
    return new Response(
      JSON.stringify({ ok: false, message: String(e) }),
      { status: 500, headers: { "content-type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
