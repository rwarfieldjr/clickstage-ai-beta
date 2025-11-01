import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResult {
  endpoint: string;
  status: string;
  response_time_ms: number;
  success: boolean;
  error_message: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const siteUrl = Deno.env.get("SITE_URL") || "https://clickstagepro.com";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[verify-checkouts] Missing Supabase credentials");
    return new Response(JSON.stringify({ error: "Configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const results: HealthCheckResult[] = [];
  let hasFailures = false;

  console.log("[verify-checkouts] Starting automated checkout stability check");

  // Test 1: create-simple-checkout
  try {
    console.log("[verify-checkouts] Testing create-simple-checkout...");
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke("create-simple-checkout", {
      body: { priceId: "price_test_validation" },
    });

    const responseTime = Date.now() - startTime;
    const isSuccess = !error && data?.url && typeof data.url === "string";
    
    results.push({
      endpoint: "create-simple-checkout",
      status: error ? `error: ${error.message}` : "success",
      response_time_ms: responseTime,
      success: isSuccess,
      error_message: error ? error.message : (data?.error || null),
    });

    if (!isSuccess) {
      hasFailures = true;
      console.error("[verify-checkouts] ❌ create-simple-checkout failed:", error || data);
    } else {
      console.log(`[verify-checkouts] ✓ create-simple-checkout passed (${responseTime}ms)`);
    }
  } catch (err: any) {
    results.push({
      endpoint: "create-simple-checkout",
      status: "exception",
      response_time_ms: 0,
      success: false,
      error_message: err.message || String(err),
    });
    hasFailures = true;
    console.error("[verify-checkouts] ❌ create-simple-checkout exception:", err);
  }

  // Test 2: create-checkout (with minimal valid payload)
  try {
    console.log("[verify-checkouts] Testing create-checkout...");
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId: "price_test_validation",
        contactInfo: {
          email: "test@clickstagepro.com",
          firstName: "Test",
          lastName: "User",
          phoneNumber: "+15555555555",
        },
        files: [],
        stagingStyle: "modern",
        photosCount: 1,
        sessionId: crypto.randomUUID(),
        turnstileToken: "test-token",
      },
    });

    const responseTime = Date.now() - startTime;
    const isSuccess = !error && data?.url && typeof data.url === "string";
    
    results.push({
      endpoint: "create-checkout",
      status: error ? `error: ${error.message}` : "success",
      response_time_ms: responseTime,
      success: isSuccess,
      error_message: error ? error.message : (data?.error || null),
    });

    if (!isSuccess) {
      hasFailures = true;
      console.error("[verify-checkouts] ❌ create-checkout failed:", error || data);
    } else {
      console.log(`[verify-checkouts] ✓ create-checkout passed (${responseTime}ms)`);
    }
  } catch (err: any) {
    results.push({
      endpoint: "create-checkout",
      status: "exception",
      response_time_ms: 0,
      success: false,
      error_message: err.message || String(err),
    });
    hasFailures = true;
    console.error("[verify-checkouts] ❌ create-checkout exception:", err);
  }

  // Log all results to checkout_health_log table
  console.log("[verify-checkouts] Logging results to database...");
  for (const result of results) {
    const { error: logError } = await supabase.from("checkout_health_log").insert({
      endpoint: result.endpoint,
      status: result.status,
      response_time_ms: result.response_time_ms,
      success: result.success,
      error_message: result.error_message,
    });

    if (logError) {
      console.error(`[verify-checkouts] Failed to log ${result.endpoint}:`, logError);
    }
  }

  // Send alert email if any failures detected
  if (hasFailures && resendApiKey) {
    console.log("[verify-checkouts] Sending failure alert email...");
    try {
      const failedEndpoints = results.filter(r => !r.success);
      const emailBody = `
        <h2>🚨 Checkout Stability Check Failed</h2>
        <p>Automated post-deploy verification detected failures in checkout endpoints:</p>
        
        ${failedEndpoints.map(f => `
          <div style="background: #fee; padding: 15px; margin: 10px 0; border-left: 4px solid #c33;">
            <h3>${f.endpoint}</h3>
            <p><strong>Status:</strong> ${f.status}</p>
            <p><strong>Response Time:</strong> ${f.response_time_ms}ms</p>
            ${f.error_message ? `<p><strong>Error:</strong> ${f.error_message}</p>` : ''}
          </div>
        `).join('')}
        
        <h3>All Results:</h3>
        <ul>
          ${results.map(r => `
            <li>
              <strong>${r.endpoint}:</strong> 
              ${r.success ? '✅' : '❌'} ${r.status} (${r.response_time_ms}ms)
            </li>
          `).join('')}
        </ul>
        
        <p><strong>Site URL:</strong> ${siteUrl}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <p>Please investigate and resolve these issues immediately to prevent customer checkout failures.</p>
      `;

      // Send email via notify-alert function
      const { error: alertError } = await supabase.functions.invoke("notify-alert", {
        body: {
          subject: "🚨 Checkout Stability Check Failed",
          details: {
            failedEndpoints: failedEndpoints.map(f => ({
              endpoint: f.endpoint,
              status: f.status,
              response_time_ms: f.response_time_ms,
              error_message: f.error_message,
            })),
            allResults: results,
            siteUrl,
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (alertError) {
        console.error("[verify-checkouts] Failed to send alert via notify-alert:", alertError);
      } else {
        console.log("[verify-checkouts] Alert sent successfully via notify-alert");
      }
    } catch (emailError: any) {
      console.error("[verify-checkouts] Failed to send alert email:", emailError);
    }
  }

  // Return summary
  const summary = {
    timestamp: new Date().toISOString(),
    total_checks: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results,
    alert_sent: hasFailures && !!resendApiKey,
  };

  console.log("[verify-checkouts] Check complete:", summary);

  return new Response(JSON.stringify(summary), {
    status: hasFailures ? 500 : 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
