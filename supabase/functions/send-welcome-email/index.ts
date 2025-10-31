import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email }: WelcomeEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "ClickStage Pro <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to ClickStage Pro!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ClickStage Pro</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">ClickStage Pro</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Welcome, ${name}!</h2>
                        
                        <p style="margin: 0 0 16px; color: #555555; font-size: 16px; line-height: 1.6;">
                          Thank you for creating an account with ClickStage Pro. We're excited to help you transform your property photos with professional virtual staging.
                        </p>
                        
                        <p style="margin: 0 0 24px; color: #555555; font-size: 16px; line-height: 1.6;">
                          Here's what you can do next:
                        </p>
                        
                        <ul style="margin: 0 0 24px; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
                          <li>Upload your property photos</li>
                          <li>Choose from our collection of professional staging styles</li>
                          <li>Receive your staged photos within 24-48 hours</li>
                          <li>Download and use them to showcase your properties</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "https://clickstagepro.lovable.app"}/dashboard" 
                             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Go to Dashboard
                          </a>
                        </div>
                        
                        <p style="margin: 24px 0 0; color: #777777; font-size: 14px; line-height: 1.6;">
                          Need help? Contact our support team anytime at 
                          <a href="mailto:support@clickstagepro.com" style="color: #667eea; text-decoration: none;">support@clickstagepro.com</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                          © ${new Date().getFullYear()} ClickStage Pro. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
