import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { verifyTurnstile } from "../_shared/verify-turnstile.ts";
import { sendSupportAlert } from "../_shared/support-alert.ts";
import { getLogger } from "../_shared/production-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logger = getLogger("create-checkout");

// Always return 2xx with success/error structure
function okJSON(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Parse credits safely from Stripe price metadata
function parseCreditsFromPrice(price: Stripe.Price): number {
  const fromPrice = Number((price.metadata?.bundle_size as string) ?? "");
  if (!Number.isNaN(fromPrice) && fromPrice > 0) return fromPrice;

  const product = price.product as Stripe.Product;
  const fromProduct = Number((product?.metadata?.bundle_size as string) ?? "");
  if (!Number.isNaN(fromProduct) && fromProduct > 0) return fromProduct;

  return 1; // safe default
}

// Input validation schema
const CreateCheckoutSchema = z.object({
  priceId: z.string().startsWith('price_').max(100),
  contactInfo: z.object({
    email: z.string().email().max(255),
    firstName: z.string().max(100),
    lastName: z.string().max(100),
    phoneNumber: z.string().max(50).optional(),
  }),
  files: z.array(z.string().max(10000000)).max(100).optional(), // 10MB per file as base64
  stagingStyle: z.string().max(50).optional(),
  photosCount: z.number().int().positive().max(1000),
  sessionId: z.string().uuid().optional(),
  turnstileToken: z.string().min(1),
});

const handler = async (req: Request): Promise<Response> => {
  const startedAt = new Date().toISOString();
  const hostname = req.headers.get("host") ?? "unknown";
  const path = new URL(req.url).pathname;

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
    logger.info("Checkout function started");

    // Rate limiting: Get client IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    logger.debug("Client IP detected", { ip: clientIp });

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
        if (rateLimitData.attempt_count >= 100) {
          logger.warn("Rate limit exceeded", { ip: clientIp, attempts: rateLimitData.attempt_count });
          await sendSupportAlert("Checkout Blocked – Rate Limit", {
            hostname,
            path,
            code: 429,
            reason: "rate_limit_exceeded",
            ip: clientIp,
            attempts: rateLimitData.attempt_count,
          });
          return okJSON({ 
            success: false,
            error: "Too many checkout attempts. Please try again in an hour.",
            retryAfter: Math.ceil((60 * 60 * 1000 - (now.getTime() - windowStart.getTime())) / 1000)
          });
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

    logger.info("Rate limit check passed");

    // Get and validate request body
    const body = await req.json();
    const validation = CreateCheckoutSchema.safeParse(body);
    
    if (!validation.success) {
      logger.warn("Validation failed", { errors: validation.error.format() });
      await sendSupportAlert("Checkout Blocked – Validation Failed", {
        hostname,
        path,
        code: 400,
        reason: "validation_failed",
        errors: validation.error.format(),
      });
      return okJSON({ 
        success: false,
        error: "Invalid input parameters", 
        details: validation.error.format() 
      });
    }

    const { priceId, contactInfo, files, stagingStyle, photosCount, sessionId, turnstileToken } = validation.data;

    // Verify Turnstile CAPTCHA token
    logger.info("Verifying Turnstile token");
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      logger.warn("Turnstile verification failed");
      await sendSupportAlert("Checkout Blocked – Turnstile Failed", {
        hostname,
        path,
        code: 400,
        reason: "turnstile_failed",
      });
      return okJSON({
        success: false,
        error: "Security verification failed. Please try again.",
        code: "CAPTCHA_VERIFICATION_FAILED"
      });
    }

    logger.info("Turnstile verification successful");
    logger.info("Request validated", { priceId, fileCount: files?.length, photosCount });

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
        logger.info("Authenticated user found", { userId: user.id });
      }
    }

    // For guest checkout, use email from contactInfo
    if (!customerEmail) {
      if (!contactInfo?.email) {
        logger.warn("Guest checkout requires email in contactInfo");
        await sendSupportAlert("Checkout Blocked – Missing Email", {
          hostname,
          path,
          code: 400,
          reason: "missing_email",
        });
        return okJSON({ 
          success: false,
          error: "Email is required for checkout" 
        });
      }
      customerEmail = contactInfo.email;
      logger.info("Guest checkout initiated");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    logger.info("Stripe initialized");

    // Validate Stripe price before creating session
    let price: Stripe.Price;
    try {
      price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
      logger.info("Price retrieved", { priceId, active: price.active });
    } catch (err: any) {
      logger.error("Invalid price ID", { priceId, error: err.message });
      await sendSupportAlert("Checkout Error – Invalid Price ID", {
        hostname,
        path,
        priceId,
        error: err.message,
      });
      return okJSON({ 
        success: false,
        error: "Invalid or unknown pricing option. Please try again or contact support." 
      });
    }

    if (!price?.active) {
      logger.error("Inactive price", { priceId });
      await sendSupportAlert("Checkout Error – Inactive Price", {
        hostname,
        path,
        priceId,
      });
      return okJSON({ 
        success: false,
        error: "This pricing option is currently unavailable. Please contact support." 
      });
    }

    // Parse credits from price metadata
    const credits = parseCreditsFromPrice(price);
    logger.info("Credits parsed from price", { credits, priceId });

    // Check if a Stripe customer record exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logger.debug("Existing customer found");
    } else {
      logger.debug("No existing customer found");
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

    if (credits) {
      metadata.credits = credits.toString();
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
      logger.info("Checkout data stored in database", { sessionId, fileCount: files?.length || 0 });
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
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/upload`,
      metadata: metadata,
    });

    if (!session?.url) {
      logger.error("Session missing URL", { sessionId: session?.id });
      await sendSupportAlert("Checkout Error – Session Missing URL", {
        hostname,
        path,
        priceId,
        sessionData: JSON.stringify(session, null, 2),
      });
      return okJSON({
        success: false,
        error: "We couldn't start the Stripe checkout. Please try again or contact support."
      });
    }

    logger.info("Checkout session created successfully", { sessionId: session.id });

    return okJSON({ 
      success: true,
      url: session.url, 
      sessionId: session.id 
    });
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const status = err?.statusCode ?? err?.status ?? 500;
    logger.error("Checkout error", { message: errorMessage, status });
    
    // Send support alert for checkout failures
    await sendSupportAlert("Checkout Failure – Action Required", {
      startedAt,
      hostname,
      path,
      method: req.method,
      code: status,
      message: errorMessage,
      stack: err?.stack ?? "",
    });
    
    // Always return 2xx with error details
    return okJSON({
      success: false,
      error: "We couldn't start your checkout just now. Please try again or contact support@clickstagepro.com."
    });
  }
};

serve(handler);