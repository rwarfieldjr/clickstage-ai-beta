import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const VerifyPaymentSchema = z.object({
  sessionId: z.string().min(1).max(200),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const authenticatedUserId = userData.user.id;

    // Parse and validate input
    const body = await req.json();
    const validation = VerifyPaymentSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid session ID format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { sessionId } = validation.data;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ success: false, message: "Payment not completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const userId = session.metadata?.user_id;
    const photosCount = session.metadata?.photos_count ? parseInt(session.metadata.photos_count) : 0;

    if (!userId || !photosCount) {
      return new Response(
        JSON.stringify({ error: "Invalid payment session data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify the authenticated user matches the session metadata
    if (authenticatedUserId !== userId) {
      console.error(`Authentication mismatch: authenticated user ${authenticatedUserId} != session user ${userId}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized access to payment session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if this session has already been processed
    const { data: existingSession, error: checkError } = await supabaseAdmin
      .from("processed_stripe_sessions")
      .select("id, processed_at")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking processed sessions:", checkError);
      throw new Error("Failed to verify payment status");
    }

    if (existingSession) {
      console.log(`Session ${sessionId} already processed at ${existingSession.processed_at}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Payment already processed" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ✅ Use unified atomic credit update system (user_id-based)
    console.log(`[verify-payment] Adding ${photosCount} credits for user ${userId} via atomic update`);
    
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('update_user_credits_atomic', {
      p_user_id: userId,
      p_delta: photosCount,
      p_reason: `Payment verified - Session ${sessionId}`,
      p_order_id: null
    });

    if (rpcError) {
      console.error('[verify-payment] Atomic credit update failed:', rpcError);
      throw new Error(`Failed to add credits: ${rpcError.message}`);
    }

    const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
    if (!row?.ok) {
      console.error('[verify-payment] Credit update returned error:', row?.message);
      throw new Error(row?.message || 'Failed to add credits');
    }

    const newCredits = row.balance;
    console.log(`[verify-payment] ✓ Credits added successfully. User ${userId} new balance: ${newCredits}`);

    // Record this session as processed
    const { error: trackingError } = await supabaseAdmin
      .from("processed_stripe_sessions")
      .insert({
        session_id: sessionId,
        user_id: userId,
        payment_intent_id: session.payment_intent as string,
        credits_added: photosCount,
      });

    if (trackingError) {
      console.error("Error tracking processed session:", trackingError);
      // Don't fail the entire operation if tracking fails
    }

    // Create order records for each uploaded file
    const files = session.metadata?.files ? JSON.parse(session.metadata.files) : [];
    let orderNumber = null;
    
    if (files.length > 0) {
      const stagingStyle = session.metadata?.staging_style || 'modern-farmhouse';
      
      // Insert orders (order_number will be auto-generated by the sequence)
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert(
          files.map((file: string) => ({
            user_id: userId,
            original_image_url: file,
            staging_style: stagingStyle,
            status: 'pending',
            credits_used: 1,
            stripe_payment_id: session.payment_intent as string,
          }))
        )
        .select('order_number')
        .order('order_number', { ascending: true })
        .limit(1);

      if (orderError) {
        console.error('Error creating orders:', orderError);
      } else if (orderData && orderData.length > 0) {
        orderNumber = orderData[0].order_number;
        console.log(`Created ${files.length} orders starting with #${orderNumber}`);
      }
    }

    console.log(`[verify-payment] Payment verified successfully for user ${userId}. Credits: ${newCredits}`);

    // Send notification emails
    try {
      const notificationResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          sessionId,
          orderNumber: orderNumber,
          customerName: session.metadata?.customer_name || 'Customer',
          customerEmail: session.customer_details?.email || session.metadata?.customer_email,
          photosCount,
          amountPaid: session.amount_total ? session.amount_total / 100 : 0,
          files: files,
          stagingStyle: session.metadata?.staging_style,
        }),
      });

      if (!notificationResponse.ok) {
        console.error('Failed to send notification emails:', await notificationResponse.text());
      }
    } catch (notificationError) {
      console.error('Error sending notification emails:', notificationError);
      // Don't fail the payment verification if email fails
    }

    return new Response(
      JSON.stringify({ success: true, credits: newCredits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    
    // Return sanitized error to client
    const clientError = error?.message?.includes('validation')
      ? error.message
      : 'Payment verification failed. Please try again.';
    
    return new Response(
      JSON.stringify({ error: clientError }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
