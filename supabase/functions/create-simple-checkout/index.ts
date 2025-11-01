import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { getLogger } from "../_shared/production-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logger = getLogger("create-simple-checkout");

/**
 * SIMPLIFIED STRIPE CHECKOUT
 * 
 * Purpose: Create Stripe checkout sessions with minimal input
 * Use case: Quick purchases from pricing page or buy buttons
 * 
 * Required input: { priceId: string }
 * Returns: { url: string } - Stripe checkout URL
 * 
 * Security: Public endpoint (no JWT required)
 * Rate limiting: Client-side only (consider adding server-side if needed)
 */

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info("Simple checkout request started");

    // Parse request body
    const body = await req.json();
    const { priceId } = body;

    // Validate required input
    if (!priceId || typeof priceId !== 'string') {
      logger.warn("Missing or invalid priceId", { priceId });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing priceId parameter" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      logger.warn("Invalid price ID format", { priceId });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid price ID format. Must start with 'price_'" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get environment variables with fallback
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY_BACKEND") || 
                      Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeKey) {
      logger.error("Stripe secret key not configured");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Payment system configuration error. Please contact support." 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || req.headers.get("origin") || "http://localhost:5173";

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    logger.info("Stripe initialized, validating price");

    // Validate that the price exists and is active
    let price: Stripe.Price;
    try {
      price = await stripe.prices.retrieve(priceId);
      
      if (!price.active) {
        logger.warn("Inactive price requested", { priceId });
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "This pricing option is currently unavailable" 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      logger.info("Price validated successfully", { priceId, active: price.active });
    } catch (err: any) {
      logger.error("Invalid price ID", { priceId, error: err.message });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid pricing option. Please try again or contact support." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Stripe Checkout Session
    logger.info("Creating checkout session");
    
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?cancelled=true`,
      allow_promotion_codes: true,
      metadata: {
        source: "create-simple-checkout",
        price_id: priceId,
      },
    });

    if (!session?.url) {
      logger.error("Session created but missing URL", { sessionId: session?.id });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Failed to generate checkout URL. Please try again." 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    logger.info("Checkout session created successfully", { sessionId: session.id });

    return new Response(
      JSON.stringify({ 
        success: true,
        url: session.url,
        sessionId: session.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Unexpected error in simple checkout", { 
      error: errorMessage,
      stack: err?.stack 
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred. Please try again or contact support@clickstagepro.com",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
