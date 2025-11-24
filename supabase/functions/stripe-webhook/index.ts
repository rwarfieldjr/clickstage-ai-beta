// @version: stable-credits-2.0 | STABILITY HARDENED | Atomic credit updates with full audit trail

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { updateUserCreditsAtomic } from "../_shared/atomic-credits.ts";
import { logSystemEvent } from "../_shared/log-system-event.ts";
import { sendSupportAlert } from "../_shared/support-alert.ts";

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
      event = await stripe.webhooks.constructEventAsync(
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
      await logSystemEvent(
        'Stripe webhook received - checkout.session.completed',
        'info',
        undefined,
        '/stripe-webhook',
        { session_id: session.id }
      );

      // Initialize Supabase admin client
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // SECURITY: Deduplicate using stripe_event_log
      try {
        const { error: eventLogError } = await supabaseAdmin
          .from("stripe_event_log")
          .insert({
            id: event.id,
            event_type: event.type,
            payload: event as any
          });

        if (eventLogError) {
          if (eventLogError.code === '23505') {
            console.log("Event already processed (duplicate):", event.id);
            await logSystemEvent(
              'Duplicate Stripe event ignored',
              'info',
              undefined,
              '/stripe-webhook',
              { event_id: event.id, session_id: session.id }
            );
            return new Response(
              JSON.stringify({ received: true, message: "Already processed" }),
              { 
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              }
            );
          }
          throw eventLogError;
        }
        console.log("Event logged successfully:", event.id);
      } catch (logError) {
        console.error("Failed to log event:", logError);
        await sendSupportAlert(
          'Stripe webhook event log failure',
          { event_id: event.id, error: String(logError) }
        );
        // Continue processing anyway
      }

      // SECURITY: Check if session already processed (double-check with processed_sessions)
      const { data: existingSession } = await supabaseAdmin
        .from("processed_stripe_sessions")
        .select("session_id")
        .eq("session_id", session.id)
        .maybeSingle();

      if (existingSession) {
        console.log("Session already processed (double-check), skipping:", session.id);
        await logSystemEvent(
          'Duplicate session processing prevented',
          'warn',
          undefined,
          '/stripe-webhook',
          { session_id: session.id }
        );
        return new Response(
          JSON.stringify({ received: true, message: "Already processed" }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Extract metadata
      const metadata = session.metadata || {};
      const customerEmail = metadata.customer_email || session.customer_details?.email;
      const customerName = metadata.customer_name || session.customer_details?.name || "Customer";
      const sessionId = metadata.session_id;
      const propertyAddress = metadata.property_address || "";
      
      // Retrieve files from database instead of metadata (to avoid 500 char limit)
      let files: string[] = [];
      let photosCount = parseInt(metadata.photos_count || "0");
      let stagingStyle = "";
      
      if (sessionId) {
        const { data: checkoutData } = await supabaseAdmin
          .from("abandoned_checkouts")
          .select("files, staging_style, photos_count")
          .eq("session_id", sessionId)
          .single();
          
        if (checkoutData) {
          files = checkoutData.files || [];
          stagingStyle = checkoutData.staging_style || "";
          photosCount = checkoutData.photos_count || photosCount;
          console.log("Files retrieved from database:", files.length);
        }
      }
      
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

      // Check if user exists to get user_id
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

      // SECURITY: Mark session as processed immediately to prevent race conditions
      if (userId) {
        const { error: sessionInsertError } = await supabaseAdmin
          .from("processed_stripe_sessions")
          .insert({
            session_id: session.id,
            payment_intent_id: session.payment_intent as string || null,
            user_id: userId,
            credits_added: photosCount,
          });

        if (sessionInsertError) {
          // If unique constraint violation, session was processed by concurrent request
          if (sessionInsertError.code === '23505') {
            console.log("Session processed concurrently, aborting:", session.id);
            return new Response(
              JSON.stringify({ received: true, message: "Already processed" }),
              { 
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              }
            );
          }
          console.error("Error marking session as processed:", sessionInsertError);
          throw sessionInsertError;
        }
        console.log("Session marked as processed:", session.id);
      }

      // ✅ UPDATED: Add credits using user_id (2025-11-04)
      if (photosCount > 0 && userId) {
        console.log(`Adding ${photosCount} credits for user ${userId} using atomic update`);
        
        const creditResult = await updateUserCreditsAtomic(
          supabaseAdmin,
          userId, // Now using user_id instead of email
          photosCount,
          `Stripe payment - Session ${session.id}`,
          undefined // No order_id yet
        );
        
        if (!creditResult.success) {
          console.error("CRITICAL: Failed to add credits:", creditResult.error);
          await logSystemEvent(
            'Critical: Credit addition failed after payment',
            'critical',
            userId,
            '/stripe-webhook',
            { 
              session_id: session.id, 
              email: customerEmail, 
              amount: photosCount,
              error: creditResult.error 
            }
          );
          await sendSupportAlert(
            'CRITICAL: Credit Addition Failed After Payment',
            {
              session_id: session.id,
              email: customerEmail,
              amount: photosCount,
              payment_intent: session.payment_intent,
              error: creditResult.error
            }
          );
          // Continue processing to create orders, but alert support
        } else {
          console.log(`✓ Successfully added ${photosCount} credits atomically:`, creditResult);
          await logSystemEvent(
            'Credits added successfully after payment',
            'info',
            userId,
            '/stripe-webhook',
            { 
              session_id: session.id, 
              email: customerEmail, 
              amount: photosCount,
              new_balance: creditResult.newBalance
            }
          );
        }
      }

      // Create orders from uploaded files and collect order numbers
      const orderNumbers: string[] = [];
      if (files.length > 0 && userId) {
        console.log(`Creating ${files.length} orders for user ${userId}`);
        await logSystemEvent(
          'Creating orders from webhook',
          'info',
          userId,
          '/stripe-webhook',
          { session_id: session.id, file_count: files.length }
        );
        
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
              processing_started: new Date().toISOString()
            })
            .select("order_number")
            .single();

          if (orderError) {
            console.error("Error creating order:", orderError);
            await logSystemEvent(
              'Order creation failed',
              'error',
              userId,
              '/stripe-webhook',
              { session_id: session.id, error: orderError.message }
            );
          } else if (orderData?.order_number) {
            console.log("Order created:", orderData.order_number);
            orderNumbers.push(orderData.order_number);
          }
        }
      }

      // Send notification emails with proper order number
      if (orderNumbers.length > 0) {
        // Extract file paths from full URLs for signed URL generation
        const filePaths = files.map((fileUrl: string) => {
          // If it's a full URL, extract just the path after the bucket name
          if (fileUrl.includes('/storage/v1/object/')) {
            const parts = fileUrl.split('/original-images/');
            return parts[1] || fileUrl;
          }
          return fileUrl;
        });

        const { error: notificationError } = await supabaseAdmin.functions.invoke("send-order-notification", {
          body: {
            sessionId: session.id,
            orderNumber: orderNumbers[0], // Use proper order number like "ORD-000001"
            customerName: customerName,
            customerEmail: customerEmail,
            photosCount: photosCount,
            amountPaid: (session.amount_total || 0) / 100, // Convert from cents to dollars
            files: filePaths,
            stagingStyle: stagingStyle,
            paymentMethod: "stripe",
            propertyAddress: propertyAddress,
          },
        });

        if (notificationError) {
          console.error("Error sending notification emails:", notificationError);
        } else {
          console.log("Notification emails sent successfully with order number:", orderNumbers[0]);
        }
      }

      // Mark abandoned checkout as completed using session_id for accuracy
      if (sessionId) {
        const { error: updateError } = await supabaseAdmin
          .from('abandoned_checkouts')
          .update({ 
            completed: true, 
            completed_at: new Date().toISOString() 
          })
          .eq('session_id', sessionId);

        if (updateError) {
          console.error("Error updating abandoned checkout:", updateError);
        } else {
          console.log("Abandoned checkout marked as completed for session:", sessionId);
        }
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
    
    await logSystemEvent(
      'Webhook processing error',
      'critical',
      undefined,
      '/stripe-webhook',
      { error: error.message, stack: error.stack }
    );
    
    await sendSupportAlert(
      'Stripe Webhook Processing Error',
      {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    );
    
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