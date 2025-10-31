import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { logSystemEvent } from "../_shared/log-system-event.ts";
import { sendSupportAlert } from "../_shared/support-alert.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Self-healing watchdog that repairs stuck checkout sessions
 * Runs hourly to find orders stuck in 'processing' state
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[repair-checkouts] ===== Starting checkout repair watchdog =====');
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    if (!stripeKey) {
      throw new Error('Missing Stripe credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find orders stuck in processing for >15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: stuckOrders, error: queryError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'processing')
      .lt('processing_started', fifteenMinutesAgo);

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    if (!stuckOrders || stuckOrders.length === 0) {
      console.log('[repair-checkouts] ✓ No stuck orders found');
      await logSystemEvent(
        'Repair watchdog completed - no issues found',
        'info',
        undefined,
        '/repair-checkouts'
      );
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No stuck orders found',
          checked: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[repair-checkouts] Found ${stuckOrders.length} stuck order(s)`);
    
    const repairedOrders: any[] = [];
    const failedOrders: any[] = [];

    for (const order of stuckOrders) {
      console.log(`[repair-checkouts] Checking order ${order.order_number} (${order.id})`);
      
      try {
        // Check if payment was actually successful in Stripe
        if (order.stripe_payment_id) {
          const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_id);
          
          if (paymentIntent.status === 'succeeded') {
            // Payment succeeded - mark order as completed
            console.log(`[repair-checkouts] ✓ Payment verified for ${order.order_number}, completing order`);
            
            const { error: updateError } = await supabase
              .from('orders')
              .update({ 
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);

            if (updateError) {
              throw new Error(`Failed to update order: ${updateError.message}`);
            }

            repairedOrders.push({
              order_id: order.id,
              order_number: order.order_number,
              action: 'completed',
              reason: 'Payment verified as succeeded'
            });

            await logSystemEvent(
              `Order ${order.order_number} auto-repaired - marked as completed`,
              'info',
              order.user_id,
              '/repair-checkouts',
              { order_id: order.id, payment_intent: paymentIntent.id }
            );
          } else {
            // Payment failed or pending - cancel order
            console.log(`[repair-checkouts] ⚠ Payment ${paymentIntent.status} for ${order.order_number}, canceling order`);
            
            const { error: updateError } = await supabase
              .from('orders')
              .update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);

            if (updateError) {
              throw new Error(`Failed to update order: ${updateError.message}`);
            }

            repairedOrders.push({
              order_id: order.id,
              order_number: order.order_number,
              action: 'cancelled',
              reason: `Payment status: ${paymentIntent.status}`
            });

            await logSystemEvent(
              `Order ${order.order_number} auto-repaired - marked as cancelled`,
              'warn',
              order.user_id,
              '/repair-checkouts',
              { order_id: order.id, payment_status: paymentIntent.status }
            );
          }
        } else {
          // No Stripe payment ID - likely credit-based order, cancel it
          console.log(`[repair-checkouts] ⚠ No payment ID for ${order.order_number}, canceling`);
          
          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            throw new Error(`Failed to update order: ${updateError.message}`);
          }

          repairedOrders.push({
            order_id: order.id,
            order_number: order.order_number,
            action: 'cancelled',
            reason: 'No payment reference found'
          });
        }
      } catch (orderError) {
        console.error(`[repair-checkouts] ✗ Failed to repair order ${order.order_number}:`, orderError);
        failedOrders.push({
          order_id: order.id,
          order_number: order.order_number,
          error: orderError instanceof Error ? orderError.message : String(orderError)
        });

        await logSystemEvent(
          `Failed to repair order ${order.order_number}`,
          'error',
          order.user_id,
          '/repair-checkouts',
          { order_id: order.id, error: String(orderError) }
        );
      }
    }

    // Send alert if any orders were repaired or failed
    if (repairedOrders.length > 0 || failedOrders.length > 0) {
      await sendSupportAlert(
        `Checkout Repair Watchdog Report - ${repairedOrders.length} repaired, ${failedOrders.length} failed`,
        {
          timestamp: new Date().toISOString(),
          total_stuck: stuckOrders.length,
          repaired: repairedOrders,
          failed: failedOrders
        }
      );
    }

    const summary = {
      success: true,
      checked: stuckOrders.length,
      repaired: repairedOrders.length,
      failed: failedOrders.length,
      details: {
        repaired: repairedOrders,
        failed: failedOrders
      }
    };

    console.log('[repair-checkouts] ===== Watchdog completed =====', summary);

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[repair-checkouts] Critical error:', error);
    
    await logSystemEvent(
      'Repair watchdog failed',
      'critical',
      undefined,
      '/repair-checkouts',
      { error: error instanceof Error ? error.message : String(error) }
    );

    await sendSupportAlert(
      'Checkout Repair Watchdog Failed',
      {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }
    );

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
