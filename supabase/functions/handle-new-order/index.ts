import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HandleNewOrderRequest {
  email: string;
  name: string;
  bundle_name: string;
  total_amount: number;
  photo_count: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, bundle_name, total_amount, photo_count }: HandleNewOrderRequest = await req.json();

    console.log("Processing new order for:", email);

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Resend client
    const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users.some(u => u.email === email);

    let actionLink = "";

    if (!userExists) {
      console.log("Creating new user:", email);
      
      // Create new user silently (no confirmation email)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }

      console.log("User created successfully:", newUser.user?.id);
    }

    // Generate magic link for password setup
    console.log("Generating magic link for:", email);
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError) {
      console.error("Error generating magic link:", linkError);
      throw linkError;
    }

    actionLink = linkData.properties?.action_link || "";
    console.log("Magic link generated successfully");

    // Send welcome email with magic link
    console.log("Sending welcome email to:", email);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "ClickStagePro <onboarding@resend.dev>",
      to: email,
      subject: "Create Your ClickStagePro Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hi ${name},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Thank you for your order with <strong>ClickStagePro</strong>!
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Your photos are now in our staging queue and will be processed within 24 hours.
          </p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Order Summary</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li><strong>Bundle:</strong> ${bundle_name}</li>
              <li><strong>Total:</strong> $${(total_amount / 100).toFixed(2)}</li>
              <li><strong>Photos Uploaded:</strong> ${photo_count}</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            We've created your account — click below to set your password and access your dashboard:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionLink}" 
               style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Create My Password →
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #555;">
            — The ClickStagePro Team<br>
            <a href="https://www.clickstagepro.com" style="color: #10b981;">www.ClickStagePro.com</a>
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_sent: true,
        user_existed: userExists
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in handle-new-order:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
