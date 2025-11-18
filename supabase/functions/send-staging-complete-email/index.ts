import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  order_id: string;
  user_id: string;
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

    const { order_id, user_id }: EmailRequest = await req.json();

    // Fetch order from staging_orders by order_id
    const { data: order, error: orderError } = await supabaseClient
      .from("staging_orders")
      .select("id, address_of_property, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      throw new Error("Order not found");
    }

    // Fetch user from profiles by user_id
    const { data: user, error: userError } = await supabaseClient
      .from("profiles")
      .select("email, name")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      throw new Error("User not found");
    }

    // Build URL: https://clickstagepro.com/account/orders/${order.id}
    const clientUrl = `https://clickstagepro.com/account/orders/${order.id}`;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "ClickStage Pro <orders@clickstagepro.com>",
        to: [user.email],
        subject: "Your Staged Photos Are Ready!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="font-size:16px;color:#222;">
              Hi ${user.name?.split(' ')[0] || user.name},
            </p>

            <p style="font-size:16px;color:#222;">
              Your staged photos for <strong>${order.address_of_property}</strong> are now ready.
            </p>

            <p style="margin:24px 0;">
              <a href="${clientUrl}"
                 style="background:#1D4ED8;color:white;padding:12px 20px;
                        border-radius:8px;font-size:16px;text-decoration:none;display:inline-block;">
                View Your Staged Photos
              </a>
            </p>

            <p style="font-size:14px;color:#555;">
              Thank you for using ClickStage Pro.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

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
