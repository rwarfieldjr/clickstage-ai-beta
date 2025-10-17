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

      // Extract metadata
      const metadata = session.metadata || {};
      const customerEmail = metadata.customer_email || session.customer_details?.email;
      const customerName = metadata.customer_name || session.customer_details?.name || "Customer";
      const files = metadata.files ? JSON.parse(metadata.files) : [];
      const photosCount = parseInt(metadata.photos_count || "0");
      const stagingStyle = metadata.staging_style || "";
      const firstName = metadata.first_name || "";
      const lastName = metadata.last_name || "";
      const phone = metadata.phone || "";

      if (!customerEmail) {
        console.error("No email found in session");
        return new Response(
          JSON.stringify({ error: "No email in session" }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Initialize Supabase admin client
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Check if user exists or create one
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      let userId = existingUsers?.users.find(u => u.email === customerEmail)?.id;

      if (!userId) {
        console.log("Creating new user:", customerEmail);
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
          user_metadata: { name: customerName },
        });

        if (createError) {
          console.error("Error creating user:", createError);
          throw createError;
        }

        userId = newUser.user?.id;
        console.log("User created successfully:", userId);
      }

      // Create orders from uploaded files and collect order numbers
      const orderNumbers: string[] = [];
      if (files.length > 0 && userId) {
        console.log(`Creating ${files.length} orders for user ${userId}`);
        
        for (const fileUrl of files) {
          const { data: orderData, error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
              user_id: userId,
              original_image_url: fileUrl,
              staging_style: stagingStyle,
              status: "pending",
              stripe_payment_id: session.id,
              credits_used: 1,
            })
            .select("order_number")
            .single();

          if (orderError) {
            console.error("Error creating order:", orderError);
          } else if (orderData?.order_number) {
            console.log("Order created:", orderData.order_number);
            orderNumbers.push(orderData.order_number);
          }
        }
      }

      // Send notification emails with proper order number
      if (orderNumbers.length > 0) {
        const { error: notificationError } = await supabaseAdmin.functions.invoke("send-order-notification", {
          body: {
            sessionId: session.id,
            orderNumber: orderNumbers[0], // Use proper order number like "ORD-000001"
            customerName: customerName,
            customerEmail: customerEmail,
            photosCount: photosCount,
            amountPaid: (session.amount_total || 0) / 100, // Convert from cents to dollars
            files: files,
            stagingStyle: stagingStyle,
          },
        });

        if (notificationError) {
          console.error("Error sending notification emails:", notificationError);
        } else {
          console.log("Notification emails sent successfully with order number:", orderNumbers[0]);
        }
      }

      // Mark abandoned checkout as completed
      const { error: updateError } = await supabaseAdmin
        .from('abandoned_checkouts')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('email', customerEmail)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        console.error("Error updating abandoned checkout:", updateError);
      } else {
        console.log("Abandoned checkout marked as completed for:", customerEmail);
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