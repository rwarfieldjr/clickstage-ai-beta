/**
 * Resend Email Utility
 *
 * Centralized email sending with Resend API
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'ClickStagePro <support@clickstagepro.com>';

  if (!RESEND_API_KEY) {
    console.error('[EMAIL] Missing RESEND_API_KEY environment variable');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    console.log(`[EMAIL] Sending email to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: options.from || EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Failed to send email:', error);
      return { success: false, error: `Failed to send email: ${error}` };
    }

    const data = await response.json();
    console.log('[EMAIL] Email sent successfully:', data.id);

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return { success: false, error: error.message };
  }
}