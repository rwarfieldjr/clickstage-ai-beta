import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";

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

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecret) {
      throw new Error("Missing Stripe secret key");
    }

    const stripe = new Stripe(stripeSecret, {
      appInfo: {
        name: "ClickStagePro",
        version: "1.0.0",
      },
    });

    const body = await req.json();

    const {
      customerName,
      customerEmail,
      propertyAddress,
      selectedStyle,
      selectedBundle,
      imageUrls,
      orderId,
    } = body;

    if (!customerEmail || !selectedBundle || !orderId) {
      throw new Error("Missing required fields");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publicUrl = supabaseUrl?.replace("https://", "https://www.") || "https://clickstagepro.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      success_url: `${publicUrl}/order-success?orderId=${orderId}`,
      cancel_url: `${publicUrl}/order-cancelled`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Virtual Staging Bundle: ${selectedBundle}`,
              description: `Style: ${selectedStyle}`,
            },
            unit_amount: Number(selectedBundle) * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: orderId || "",
        customerName: customerName || "",
        customerEmail: customerEmail || "",
        propertyAddress: propertyAddress || "",
        selectedStyle: selectedStyle || "",
        selectedBundle: selectedBundle || "",
        imageUrlsJson: JSON.stringify(imageUrls || []),
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
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
