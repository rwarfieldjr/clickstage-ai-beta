import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[purge-abandoned-checkouts] Starting cleanup");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ ok: false, message: "Missing environment variables" }),
        { status: 500, headers: { "content-type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    });

    // Delete abandoned checkouts older than 48 hours where not completed
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { error, count } = await supabase
      .from("abandoned_checkouts")
      .delete({ count: "exact" })
      .eq("completed", false)
      .lt("created_at", cutoffDate);

    if (error) {
      console.error("[purge-abandoned-checkouts] Delete failed:", error);
      return new Response(
        JSON.stringify({ ok: false, message: error.message }),
        { status: 500, headers: { "content-type": "application/json", ...corsHeaders } }
      );
    }

    const deletedCount = count ?? 0;
    console.log(`[purge-abandoned-checkouts] Deleted ${deletedCount} abandoned checkouts`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: `Deleted ${deletedCount} abandoned checkouts older than 48 hours`,
        deletedCount,
        cutoffDate 
      }),
      { status: 200, headers: { "content-type": "application/json", ...corsHeaders } }
    );

  } catch (e: any) {
    console.error("[purge-abandoned-checkouts] Error:", e);
    return new Response(
      JSON.stringify({ ok: false, message: String(e) }),
      { status: 500, headers: { "content-type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
