import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/** 5-minute throttle per error signature to avoid spam */
const sentCache: Record<string, number> = (globalThis as any).__cspSentCache ?? ((globalThis as any).__cspSentCache = {});

export async function sendSupportAlert(
  subject: string,
  details: Record<string, any>
) {
  try {
    const sig = subject + ":" + JSON.stringify(details?.code ?? "") + ":" + (details?.path ?? "");
    const now = Date.now();
    if (sentCache[sig] && now - sentCache[sig] < 5 * 60 * 1000) return; // throttle 5m
    sentCache[sig] = now;

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
  } catch (e) {
    console.error("sendSupportAlert failed", e);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
