import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CompletionNoticeRequest {
  userId: string;
  email: string;
  name: string;
  orderId?: string;
  isResend?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: adminRole, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || adminRole?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { userId, email, name, orderId, isResend }: CompletionNoticeRequest = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let targetOrderId = orderId;

    // If no orderId provided, find the most recent order
    if (!targetOrderId) {
      const { data: orders, error: ordersError } = await supabaseClient
        .from("orders")
        .select("id, order_number")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (orders && orders.length > 0) {
        targetOrderId = orders[0].id;
      }
    }

    const accountUrl = `${Deno.env.get("SITE_URL") || "https://clickstagepro.com"}/account/images`;

    const htmlTemplate = `
      <div style="background:#f7f9fc;padding:40px;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;padding:40px;box-shadow:0 4px 14px rgba(0,0,0,0.08);">
          <div style="text-align:center;margin-bottom:30px;">
            <img src="https://clickstagepro.com/logo.png" alt="ClickStagePro" style="max-width:180px;margin-bottom:20px;" />
            <h1 style="color:#1e293b;font-size:26px;font-weight:700;margin:0;">Your Staging Order is Complete 🎉</h1>
          </div>

          <p style="color:#334155;font-size:16px;line-height:1.6;">
            Hi {{name}},
            <br/><br/>
            Great news—your virtual staging order is now finished and ready for review!
          </p>

          <div style="text-align:center;margin:40px 0;">
            <a href="{{link}}"
               style="background:#2563EB;color:white;padding:16px 30px;border-radius:10px;font-size:18px;
                      text-decoration:none;display:inline-block;font-weight:600;">
              View My Images
            </a>
          </div>

          <p style="color:#334155;font-size:15px;line-height:1.6;">
            Inside your account, you can view your original and staged photos, download them individually or as a bundle, and place new staging requests at any time.
          </p>

          <p style="color:#334155;font-size:15px;margin-top:30px;">
            Thanks for choosing <strong>ClickStagePro</strong>. We're excited to help your listings stand out!
          </p>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:40px 0;" />

          <p style="text-align:center;color:#94a3b8;font-size:13px;">
            ClickStagePro • Virtual Staging Powered by AI<br/>
            This email was sent automatically—please do not reply.
          </p>
        </div>
      </div>
    `;

    const emailHtml = htmlTemplate
      .replace("{{name}}", name || "Customer")
      .replace("{{link}}", accountUrl);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "ClickStagePro <notifications@clickstagepro.com>",
        to: [email],
        subject: "Your ClickStagePro Staging Order Is Complete! 🎉",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    // Update order status to completed if not a resend
    if (targetOrderId && !isResend) {
      await supabaseClient
        .from("orders")
        .update({
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", targetOrderId);
    }

    // Log the email
    await supabaseClient.from("email_logs").insert({
      user_id: userId,
      email: email,
      type: isResend ? "completion_notice_resend" : "completion_notice",
      metadata: {
        sent_by: user.id,
        sent_at: new Date().toISOString(),
        email_id: emailData.id,
        order_id: targetOrderId,
      }
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id, orderId: targetOrderId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending completion notice:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send notification" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
