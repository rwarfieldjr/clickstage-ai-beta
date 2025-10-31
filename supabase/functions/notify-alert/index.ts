import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendSupportAlert } from "../_shared/support-alert.ts";

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
    const { subject, details } = await req.json();
    
    if (!subject || !details) {
      return new Response(
        JSON.stringify({ error: "Missing subject or details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fire-and-forget alert (non-blocking)
    sendSupportAlert(subject, details).catch((err) => {
      console.error("[notify-alert] Failed to send alert:", err);
    });

    // Return immediately
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[notify-alert] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
