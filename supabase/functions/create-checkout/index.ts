import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Input validation schema
const CreateCheckoutSchema = z.object({
  priceId: z.string().startsWith('price_').max(100),
  contactInfo: z.object({
    email: z.string().email().max(255),
    firstName: z.string().max(100),
    lastName: z.string().max(100),
    phoneNumber: z.string().max(50).optional(),
  }),
  files: z.array(z.string().max(500)).max(100).optional(),
  stagingStyle: z.string().max(50).optional(),
  photosCount: z.number().int().positive().max(1000),
  sessionId: z.string().uuid().optional(),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Create service role client for rate limiting
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Rate limiting: Get client IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    logStep("Client IP detected", { ip: clientIp });

    // Check rate limit (5 requests per hour per IP)
    const { data: rateLimitData } = await supabaseAdmin
      .from("checkout_rate_limits")
      .select("*")
      .eq("ip_address", clientIp)
      .single();

    if (rateLimitData) {
      const windowStart = new Date(rateLimitData.window_start);
      const now = new Date();
      
      // If within the same hour window
      if (now.getTime() - windowStart.getTime() < 60 * 60 * 1000) {
        if (rateLimitData.attempt_count >= 5) {
          logStep("Rate limit exceeded", { ip: clientIp, attempts: rateLimitData.attempt_count });
          return new Response(
            JSON.stringify({ 
              error: "Too many checkout attempts. Please try again in an hour.",
              retryAfter: Math.ceil((60 * 60 * 1000 - (now.getTime() - windowStart.getTime())) / 1000)
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
          );
        }
        
        // Increment attempt count
        await supabaseAdmin
          .from("checkout_rate_limits")
          .update({ attempt_count: rateLimitData.attempt_count + 1 })
          .eq("ip_address", clientIp);
      } else {
        // Reset window
        await supabaseAdmin
          .from("checkout_rate_limits")
          .update({ 
            attempt_count: 1, 
            window_start: now.toISOString() 
          })
          .eq("ip_address", clientIp);
      }
    } else {
      // First request from this IP
      await supabaseAdmin
        .from("checkout_rate_limits")
        .insert({ 
          ip_address: clientIp, 
          attempt_count: 1,
          window_start: new Date().toISOString()
        });
    }

    logStep("Rate limit check passed");

    // Get and validate request body
    const body = await req.json();
    const validation = CreateCheckoutSchema.safeParse(body);
    
    if (!validation.success) {
      logStep("Validation failed", { errors: validation.error.format() });
      return new Response(
        JSON.stringify({ error: "Invalid input parameters", details: validation.error.format() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { priceId, contactInfo, files, stagingStyle, photosCount, sessionId } = validation.data;
    logStep("Request validated", { priceId, hasContactInfo: !!contactInfo, fileCount: files?.length, stagingStyle, photosCount, sessionId });

    // Support both authenticated and guest checkout
    const authHeader = req.headers.get("Authorization");
    let user = null;
    let customerEmail = null;
    
    if (authHeader) {
      // Try to authenticate if header is present
      const token = authHeader.replace("Bearer ", "");
      const { data, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (data?.user) {
        user = data.user;
        customerEmail = user.email;
        logStep("Authenticated user found", { userId: user.id, email: user.email });
      }
    }

    // For guest checkout, use email from contactInfo
    if (!customerEmail) {
      if (!contactInfo?.email) {
        logStep("Guest checkout requires email in contactInfo");
        return new Response(
          JSON.stringify({ error: "Email is required for checkout" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      customerEmail = contactInfo.email;
      logStep("Guest checkout", { email: customerEmail });
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

    // Store order metadata (avoid long strings due to Stripe's 500 char limit)
    const metadata: any = {
      customer_name: contactInfo.firstName && contactInfo.lastName 
        ? `${contactInfo.firstName} ${contactInfo.lastName}`
        : user?.user_metadata?.name || customerEmail.split('@')[0] || 'Customer',
      customer_email: customerEmail,
    };
    
    metadata.first_name = contactInfo.firstName;
    metadata.last_name = contactInfo.lastName;
    if (contactInfo.phoneNumber) {
      metadata.phone = contactInfo.phoneNumber;
    }

    if (user?.id) {
      metadata.user_id = user.id;
    }

    if (photosCount) {
      metadata.photos_count = photosCount.toString();
    }

    if (sessionId) {
      metadata.session_id = sessionId;
      
      // Store checkout data in database (files stored here to avoid Stripe's 500 char metadata limit)
      await supabaseAdmin
        .from("abandoned_checkouts")
        .upsert({
          session_id: sessionId,
          first_name: contactInfo.firstName,
          last_name: contactInfo.lastName,
          email: customerEmail,
          phone_number: contactInfo.phoneNumber || '',
          files: files || [],
          staging_style: stagingStyle,
          photos_count: photosCount,
          completed: false
        }, {
          onConflict: 'session_id'
        });
      logStep("Checkout data stored in database", { sessionId, fileCount: files?.length || 0 });
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
      allow_promotion_codes: true,
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
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
    
    // Return generic error to client (security best practice)
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request. Please try again.' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});