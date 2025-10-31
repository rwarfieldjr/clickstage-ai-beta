import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CHECK-SECRETS] Starting secret verification check");

    const secretsToCheck = [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "RESEND_API_KEY",
      "LOVABLE_API_KEY",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const secretStatus = secretsToCheck.map(secretName => {
      const exists = !!Deno.env.get(secretName);
      console.log(`[CHECK-SECRETS] ${secretName}: ${exists ? "EXISTS ✓" : "MISSING ✗"}`);
      return {
        name: secretName,
        exists,
        status: exists ? "✓ Set" : "✗ Not Set"
      };
    });

    const response = {
      message: "Secret verification complete",
      secrets: secretStatus,
      totalSecrets: secretsToCheck.length,
      setSecrets: secretStatus.filter(s => s.exists).length,
      missingSecrets: secretStatus.filter(s => !s.exists).length,
    };

    console.log("[CHECK-SECRETS] Summary:", JSON.stringify({
      total: response.totalSecrets,
      set: response.setSecrets,
      missing: response.missingSecrets
    }));

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[CHECK-SECRETS] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
