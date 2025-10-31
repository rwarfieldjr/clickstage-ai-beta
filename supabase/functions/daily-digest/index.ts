import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
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
    console.log("[daily-digest] Starting digest generation");
    
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ ok: false, message: "Supabase server env missing" }, 500);
    }

    if (!resendKey) {
      return jsonResponse({ ok: false, message: "RESEND_API_KEY not configured" }, 500);
    }

    // Parse hours parameter (1-48 range)
    const url = new URL(req.url);
    const hours = Math.max(1, Math.min(48, Number(url.searchParams.get("hours") || "24")));
    
    console.log(`[daily-digest] Querying errors from last ${hours} hours`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    });
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("error_events")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[daily-digest] Database error:", error);
      return jsonResponse({ ok: false, message: error.message }, 500);
    }

    if (!data || data.length === 0) {
      console.log("[daily-digest] No errors in range");
      return jsonResponse({ ok: true, message: "No errors in range", sent: false });
    }

    console.log(`[daily-digest] Found ${data.length} error events, grouping...`);

    // Group errors by subject, code, hostname, path
    const keyOf = (r: any) => `${r.subject}|${r.code ?? ""}|${r.hostname ?? ""}|${r.path ?? ""}`;
    const groups: Record<string, any> = {};
    
    for (const r of data) {
      const k = keyOf(r);
      if (!groups[k]) {
        groups[k] = { 
          count: 0, 
          first: r.created_at, 
          last: r.created_at, 
          subject: r.subject, 
          code: r.code, 
          hostname: r.hostname, 
          path: r.path 
        };
      }
      groups[k].count++;
      if (r.created_at < groups[k].first) groups[k].first = r.created_at;
      if (r.created_at > groups[k].last) groups[k].last = r.created_at;
    }

    const rows = Object.values(groups) as any[];
    rows.sort((a, b) => b.count - a.count);

    console.log(`[daily-digest] Grouped into ${rows.length} unique error types`);

    // Build HTML table
    const table = rows.map((g: any) => `
      <tr>
        <td>${escape(g.subject)}</td>
        <td style="text-align:center;">${g.code ?? ""}</td>
        <td>${escape(g.hostname ?? "")}</td>
        <td>${escape(g.path ?? "")}</td>
        <td style="text-align:center;font-weight:bold;">${g.count}</td>
        <td style="font-size:11px;">${formatTs(g.first)}</td>
        <td style="font-size:11px;">${formatTs(g.last)}</td>
      </tr>
    `).join("");

    const html = `
      <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:1200px;margin:0 auto;padding:20px;">
        <h2 style="color:#111;margin-bottom:8px;">Daily Error Digest (Last ${hours}h)</h2>
        <p style="color:#666;margin-bottom:20px;">
          Total events: <b>${data.length}</b> · Unique error types: <b>${rows.length}</b>
        </p>
        <table cellspacing="0" cellpadding="8" border="1" style="border-collapse:collapse;font-size:13px;width:100%;">
          <thead style="background:#f3f4f6;">
            <tr>
              <th style="text-align:left;">Subject</th>
              <th style="text-align:center;">Code</th>
              <th style="text-align:left;">Hostname</th>
              <th style="text-align:left;">Path</th>
              <th style="text-align:center;">Count</th>
              <th style="text-align:left;">First Seen</th>
              <th style="text-align:left;">Last Seen</th>
            </tr>
          </thead>
          <tbody>${table}</tbody>
        </table>
        <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px;color:#555;font-size:12px;">
          <strong>💡 Tip:</strong> You can manually trigger a digest for any time range by calling:<br>
          <code style="background:#fff;padding:4px 8px;border-radius:4px;margin-top:8px;display:inline-block;">/functions/v1/daily-digest?hours=6</code>
        </div>
      </div>
    `;

    // Send email via Resend
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "ClickStagePro Alerts <alerts@notifications.clickstagepro.com>",
      to: ["support@clickstagepro.com"],
      subject: `CSP Daily Error Digest – ${rows.length} error types (${data.length} events)`,
      html
    });

    console.log("[daily-digest] Email sent successfully");

    return jsonResponse({ 
      ok: true, 
      sent: true, 
      totalEvents: data.length,
      errorTypes: rows.length,
      hours 
    });

  } catch (e: any) {
    console.error("[daily-digest] Failed:", e);
    return jsonResponse({ ok: false, message: String(e) }, 500);
  }
};

function jsonResponse(obj: any, status = 200): Response {
  return new Response(JSON.stringify(obj), { 
    status, 
    headers: { "content-type": "application/json", ...corsHeaders } 
  });
}

function escape(s: string): string {
  if (!s) return "";
  return s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { 
      "&": "&amp;", 
      "<": "&lt;", 
      ">": "&gt;", 
      '"': "&quot;",
      "'": "&#39;"
    };
    return map[c] || c;
  });
}

function formatTs(ts: string): string {
  try {
    return new Date(ts).toISOString().replace("T", " ").replace("Z", " UTC");
  } catch {
    return ts;
  }
}

serve(handler);
