import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Get request body
    const { priceId, contactInfo, files, stagingStyle, photosCount } = await req.json();
    logStep("Request received", { priceId, hasContactInfo: !!contactInfo, fileCount: files?.length, stagingStyle, photosCount });

    if (!priceId) {
      throw new Error("Price ID is required");
    }

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    let user = null;
    let customerEmail = contactInfo?.email;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
      if (user?.email) {
        customerEmail = user.email;
        logStep("Authenticated user found", { userId: user.id, email: user.email });
      }
    } else {
      logStep("Guest checkout", { email: customerEmail });
    }

    if (!customerEmail) {
      throw new Error("Email is required for checkout");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    logStep("Stripe initialized");

    // Check if a Stripe customer record exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Store order metadata
    const metadata: any = {
      staging_style: stagingStyle,
    };
    
    if (contactInfo) {
      metadata.first_name = contactInfo.firstName;
      metadata.last_name = contactInfo.lastName;
      metadata.phone = contactInfo.phoneNumber;
    }

    if (user?.id) {
      metadata.user_id = user.id;
    }

    if (photosCount) {
      metadata.photos_count = photosCount.toString();
    }

    if (files && files.length > 0) {
      metadata.files = JSON.stringify(files);
    }

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/upload`,
      metadata: metadata,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
