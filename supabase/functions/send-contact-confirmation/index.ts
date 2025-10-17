import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(1000),
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, email, message } = ContactSchema.parse(body);

    console.log("Processing contact form submission for:", email);

    // Send confirmation email to customer
    const customerEmail = await resend.emails.send({
      from: "ClickStagePro <onboarding@resend.dev>",
      to: [email],
      subject: "We Received Your Message - ClickStagePro",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .message-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
              .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Thank You for Contacting Us!</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>We've received your message and will get back to you as soon as possible, typically within 1 business day.</p>
                
                <div class="message-box">
                  <strong>Your Message:</strong>
                  <p style="margin-top: 10px;">${message.replace(/\n/g, '<br>')}</p>
                </div>
                
                <p>In the meantime, feel free to explore:</p>
                <ul>
                  <li><a href="https://clickstagepro.com/faq">Frequently Asked Questions</a></li>
                  <li><a href="https://clickstagepro.com/pricing">Pricing & Packages</a></li>
                  <li><a href="https://clickstagepro.com/portfolio">Our Portfolio</a></li>
                </ul>
                
                <p>If your inquiry is urgent, please don't hesitate to email us directly at <strong>support@clickstagepro.com</strong>.</p>
                
                <div class="footer">
                  <p><strong>ClickStagePro</strong><br>
                  Professional Virtual Staging for Real Estate<br>
                  Monday–Friday: 9 AM–5 PM EST</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Customer confirmation email sent:", customerEmail);

    // Send notification to business
    const adminEmail = await resend.emails.send({
      from: "ClickStagePro Notifications <onboarding@resend.dev>",
      to: ["support@clickstagepro.com"],
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; color: #1e293b; }
              .message-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">New Contact Form Submission</h2>
              </div>
              <div class="content">
                <div class="info-row">
                  <span class="label">Name:</span> ${name}
                </div>
                <div class="info-row">
                  <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
                </div>
                <div class="info-row">
                  <span class="label">Submitted:</span> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
                </div>
                
                <div class="message-box">
                  <strong>Message:</strong>
                  <p style="margin-top: 10px; white-space: pre-wrap;">${message}</p>
                </div>
                
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                  <em>A confirmation email has been automatically sent to the customer.</em>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Admin notification email sent:", adminEmail);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Emails sent successfully"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-confirmation function:", error);
    
    if (error.name === "ZodError") {
      return new Response(
        JSON.stringify({ error: "Invalid input data", details: error.errors }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send emails" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
