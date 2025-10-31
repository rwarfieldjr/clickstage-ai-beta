import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

/** 5-minute throttle per error signature to avoid spam */
const sentCache: Record<string, number> = (globalThis as any).__cspSentCache ?? ((globalThis as any).__cspSentCache = {});

export async function sendSupportAlert(
  subject: string,
  details: Record<string, any>
) {
  try {
    // Always log to database for daily digest
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from("error_events").insert({
        subject,
        code: details?.code,
        hostname: details?.hostname,
        path: details?.path,
        details,
      });
      
      console.log("[support-alert] Error logged to database:", subject);
    }

    // Send immediate email for critical errors (5xx, rate limits, failures)
    const isCritical = 
      (details?.code && details.code >= 500) || 
      subject.includes("Failure") ||
      subject.includes("Rate Limit");
    
    if (!isCritical) {
      console.log("[support-alert] Non-critical error, skipping email (will be in daily digest):", subject);
      return;
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("[support-alert] RESEND_API_KEY not configured, skipping email alert");
      return;
    }

    const sig = subject + ":" + JSON.stringify(details?.code ?? "") + ":" + (details?.path ?? "");
    const now = Date.now();
    if (sentCache[sig] && now - sentCache[sig] < 5 * 60 * 1000) {
      console.log("[support-alert] Throttled duplicate email alert:", subject);
      return; // throttle 5m
    }
    sentCache[sig] = now;

    const resend = new Resend(resendKey);
    const html = `
      <h2>${subject}</h2>
      <pre style="font-size:13px;line-height:1.4;background:#111;color:#fafafa;padding:12px;border-radius:8px;white-space:pre-wrap;">
${escapeHtml(JSON.stringify(details, null, 2))}
      </pre>
    `;
    
    await resend.emails.send({
      from: "ClickStagePro Alerts <alerts@notifications.clickstagepro.com>",
      to: ["support@clickstagepro.com"],
      subject,
      html,
    });

    console.log("[support-alert] Critical alert email sent:", subject);
  } catch (e) {
    console.error("[support-alert] Failed to process alert:", e);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
