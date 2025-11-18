import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const webhookUrl = Deno.env.get("GHL_WEBHOOK_URL");

    if (!webhookUrl) {
      throw new Error("Missing GHL webhook URL");
    }

    const payload = {
      orderId: body.orderId || "",
      customerName: body.customerName || "",
      customerEmail: body.customerEmail || "",
      propertyAddress: body.propertyAddress || "",
      selectedStyle: body.selectedStyle || "",
      selectedBundle: body.selectedBundle || "",
      imageUrls: body.imageUrls || []
    };

    const ghlResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!ghlResponse.ok) {
      const txt = await ghlResponse.text();
      throw new Error("GHL webhook error: " + txt);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("send-to-ghl error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Unknown error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
