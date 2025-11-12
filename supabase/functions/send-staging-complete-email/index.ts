import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  orderId: string;
  shareToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId, shareToken }: EmailRequest = await req.json();

    // Get order and user details
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select(`
        *,
        profiles (
          name,
          email
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const clientUrl = `${Deno.env.get("SITE_URL")}/gallery/${shareToken}`;

    const emailResponse = await resend.emails.send({
      from: "Virtual Staging <onboarding@resend.dev>",
      to: [order.profiles.email],
      subject: "Your Staged Images Are Ready! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your Virtual Staging is Complete!</h1>
          <p>Hi ${order.profiles.name},</p>
          <p>Great news! Your virtually staged images are now ready for viewing and download.</p>
          <p>Order: <strong>${order.order_number}</strong></p>
          <p style="margin: 30px 0;">
            <a href="${clientUrl}" 
               style="background-color: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Your Staged Images
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will remain active for 30 days. You can download your images at any time during this period.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            If you have any questions, please don't hesitate to reach out to us.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
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
