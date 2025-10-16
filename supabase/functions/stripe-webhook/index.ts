import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Webhook received");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No stripe-signature header found");
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
      console.log("Webhook signature verified successfully");
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Event type:", event.type);

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing checkout.session.completed for session:", session.id);

      // Extract customer details
      const email = session.customer_details?.email;
      const name = session.customer_details?.name || "Customer";
      const total_amount = session.amount_total || 0;
      const bundle_name = session.metadata?.bundle_name || "Unknown Bundle";
      const photo_count = parseInt(session.metadata?.photo_count || "0");

      if (!email) {
        console.error("No email found in session");
        return new Response(
          JSON.stringify({ error: "No email in session" }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      console.log("Calling handle-new-order function with:", {
        email,
        name,
        bundle_name,
        total_amount,
        photo_count,
      });

      // Initialize Supabase client to call the handle-new-order function
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Call the handle-new-order function
      const { data, error } = await supabaseAdmin.functions.invoke("handle-new-order", {
        body: {
          email,
          name,
          bundle_name,
          total_amount,
          photo_count,
        },
      });

      if (error) {
        console.error("Error calling handle-new-order:", error);
        // Still return 200 to Stripe to acknowledge receipt
        return new Response(
          JSON.stringify({ 
            received: true, 
            warning: "Order processing failed but webhook received" 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      console.log("handle-new-order completed successfully:", data);

      // Mark abandoned checkout as completed
      const { error: updateError } = await supabaseAdmin
        .from('abandoned_checkouts')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('email', email)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        console.error("Error updating abandoned checkout:", updateError);
      } else {
        console.log("Abandoned checkout marked as completed for:", email);
      }
    }

    // Always return 200 to acknowledge receipt
    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Webhook error:", error);
    // Return 200 even on error to prevent Stripe from retrying
    return new Response(
      JSON.stringify({ 
        received: true, 
        error: error.message 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
