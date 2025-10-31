import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { sendSupportAlert } from "../_shared/support-alert.ts";
import { logSystemEvent } from "../_shared/log-system-event.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
    
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { 
      auth: { persistSession: false } 
    });

    const STUCK_MINUTES = parseInt(Deno.env.get("REPAIR_STUCK_MINUTES") ?? "15", 10);
    const since = new Date(Date.now() - STUCK_MINUTES * 60_000).toISOString();

    console.log(`[repair-checkouts] Checking for orders stuck in 'processing' since ${since}`);

    // Find stuck orders in 'processing' older than threshold
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id,user_id,status,stripe_payment_id,credits_used,created_at,updated_at")
      .eq("status", "processing")
      .lt("updated_at", since)
      .order("updated_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[repair-checkouts] Query failed:", error);
      await sendSupportAlert("RepairCheckouts: query failed", { 
        code: 500, 
        message: error.message 
      });
      return new Response(
        JSON.stringify({ ok: false, message: error.message }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!orders || orders.length === 0) {
      console.log("[repair-checkouts] No stuck orders found");
      return new Response(
        JSON.stringify({ ok: true, checked: 0, repaired: 0 }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[repair-checkouts] Found ${orders.length} stuck orders to process`);

    let repaired = 0;
    let failed = 0;
    const repairedDetails: any[] = [];
    const failedDetails: any[] = [];

    for (const order of orders) {
      try {
        console.log(`[repair-checkouts] Processing order ${order.id}`);

        // If Stripe payment is involved, check the Payment Intent
        if (order.stripe_payment_id) {
          const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_id);
          console.log(`[repair-checkouts] Stripe PI ${pi.id} status: ${pi.status}`);

          if (pi.status === "succeeded") {
            // Deduplicate using stripe_event_log
            const { error: insErr } = await supabase
              .from("stripe_event_log")
              .insert({
                id: pi.id,
                event_type: "payment_intent.succeeded",
              });

            if (insErr && !insErr.message?.includes("duplicate key")) {
              throw new Error("stripe_event_log insert failed: " + insErr.message);
            }

            // If this was a credit deduction order, verify it was processed
            if (order.credits_used && order.credits_used > 0) {
              const { data: ledger } = await supabase
                .from("credit_ledger")
                .select("id")
                .eq("order_id", order.id)
                .limit(1);

              if (!ledger || ledger.length === 0) {
                // Deduct credits if not already done using RPC
                const { data, error: rpcError } = await supabase.rpc(
                  "update_user_credits_atomic",
                  {
                    p_user_id: order.user_id,
                    p_delta: -order.credits_used,
                    p_reason: "usage_repair",
                    p_order_id: order.id,
                  }
                );
                
                if (rpcError) {
                  await sendSupportAlert("RepairCheckouts: usage deduction failed", {
                    code: 500,
                    user_id: order.user_id,
                    order_id: order.id,
                    delta: -order.credits_used,
                    error: rpcError.message,
                  });
                  failedDetails.push({ order_id: order.id, reason: "credit_deduction_failed" });
                  failed++;
                  continue;
                }

                const result = Array.isArray(data) ? data[0] : data;
                if (!result?.ok) {
                  await sendSupportAlert("RepairCheckouts: credit deduction returned not ok", {
                    code: 500,
                    user_id: order.user_id,
                    order_id: order.id,
                    delta: -order.credits_used,
                    result,
                  });
                  failedDetails.push({ order_id: order.id, reason: "credit_deduction_not_ok" });
                  failed++;
                  continue;
                }
              }
            }

            // Mark order as completed
            await supabase
              .from("orders")
              .update({ 
                status: "completed", 
                updated_at: new Date().toISOString() 
              })
              .eq("id", order.id);

            await logSystemEvent(
              `Order ${order.id} auto-repaired: marked as completed`,
              "info",
              order.user_id,
              "/repair-checkouts",
              { order_id: order.id, stripe_payment_id: pi.id }
            );

            repairedDetails.push({ order_id: order.id, action: "marked_completed" });
            repaired++;
            console.log(`[repair-checkouts] ✅ Order ${order.id} marked as completed`);
            continue;
          }

          // Payment failed or was cancelled
          if (pi.status === "canceled" || pi.status === "requires_payment_method") {
            await supabase
              .from("orders")
              .update({ 
                status: "cancelled", 
                updated_at: new Date().toISOString() 
              })
              .eq("id", order.id);

            await logSystemEvent(
              `Order ${order.id} auto-repaired: marked as cancelled (PI status: ${pi.status})`,
              "info",
              order.user_id,
              "/repair-checkouts",
              { order_id: order.id, stripe_payment_id: pi.id, pi_status: pi.status }
            );

            repairedDetails.push({ order_id: order.id, action: "marked_cancelled" });
            repaired++;
            console.log(`[repair-checkouts] ✅ Order ${order.id} marked as cancelled`);
            continue;
          }

          // For 'requires_action', 'processing', do nothing; it may complete later
          console.log(`[repair-checkouts] ⏳ Order ${order.id} still processing (PI status: ${pi.status})`);
          continue;
        }

        // No Stripe PI: check if credits were already deducted via ledger
        const { data: ledger, error: ledErr } = await supabase
          .from("credit_ledger")
          .select("id")
          .eq("order_id", order.id)
          .limit(1);

        if (ledErr) {
          throw new Error("ledger lookup failed: " + ledErr.message);
        }

        if (ledger && ledger.length > 0) {
          // Credits were deducted, mark as completed
          await supabase
            .from("orders")
            .update({ 
              status: "completed", 
              updated_at: new Date().toISOString() 
            })
            .eq("id", order.id);

          await logSystemEvent(
            `Order ${order.id} auto-repaired: marked as completed (credits-only)`,
            "info",
            order.user_id,
            "/repair-checkouts",
            { order_id: order.id }
          );

          repairedDetails.push({ order_id: order.id, action: "marked_completed_credits_only" });
          repaired++;
          console.log(`[repair-checkouts] ✅ Order ${order.id} (credits-only) marked as completed`);
        } else {
          // No ledger entry and no payment - cancel for safety
          await supabase
            .from("orders")
            .update({ 
              status: "cancelled", 
              updated_at: new Date().toISOString() 
            })
            .eq("id", order.id);

          await sendSupportAlert("RepairCheckouts: credits-only order cancelled (no ledger)", {
            code: 409,
            order_id: order.id,
            user_id: order.user_id,
          });

          await logSystemEvent(
            `Order ${order.id} auto-repaired: marked as cancelled (no ledger entry)`,
            "warn",
            order.user_id,
            "/repair-checkouts",
            { order_id: order.id }
          );

          repairedDetails.push({ order_id: order.id, action: "marked_cancelled_no_ledger" });
          repaired++;
          console.log(`[repair-checkouts] ⚠️ Order ${order.id} cancelled (no ledger)`);
        }
      } catch (e: any) {
        console.error(`[repair-checkouts] Error processing order ${order.id}:`, e);
        await sendSupportAlert("RepairCheckouts: exception", {
          code: 500,
          order_id: order.id,
          message: String(e?.message ?? e),
          stack: e?.stack ?? "",
        });
        failedDetails.push({ order_id: order.id, error: e.message });
        failed++;
      }
    }

    // Send summary if any orders were processed
    if (repaired > 0 || failed > 0) {
      await sendSupportAlert("RepairCheckouts: Batch Summary", {
        code: 200,
        checked: orders.length,
        repaired,
        failed,
        repaired_details: repairedDetails,
        failed_details: failedDetails,
      });
    }

    console.log(`[repair-checkouts] ✅ Batch complete: ${repaired} repaired, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        checked: orders.length,
        repaired,
        failed,
        repaired_details: repairedDetails,
        failed_details: failedDetails,
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("[repair-checkouts] Critical error:", error);
    await sendSupportAlert("RepairCheckouts: Critical Failure", {
      code: 500,
      message: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({ ok: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
