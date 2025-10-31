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
      from: "ClickStagePro <support@clickstagepro.com>",
      to: [email],
      subject: "Welcome to ClickStagePro — Your Account Is Ready!",
      html: `<div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color:#1D4ED8;">Welcome to ClickStagePro!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for creating your account. You can now log in to view and download your virtually staged photos anytime.</p>
      <a href="https://clickstagepro.com/auth" style="background:#1D4ED8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Log In to Your Account</a>
      <p style="margin-top:16px;">Need help? Reply to this email or visit <a href="https://clickstagepro.com/contact">our support page</a>.</p>
      <p>— The ClickStagePro Team</p>
    </div>`,
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
