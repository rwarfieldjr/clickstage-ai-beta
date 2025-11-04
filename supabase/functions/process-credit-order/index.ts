import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { verifyTurnstile } from "../_shared/verify-turnstile.ts";
import { sendSupportAlert } from "../_shared/support-alert.ts";
import { updateUserCreditsAtomic, acquireCheckoutLock, releaseCheckoutLock } from "../_shared/atomic-credits.ts";
import { logSystemEvent } from "../_shared/log-system-event.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreditOrderRequest {
  files: string[];
  stagingStyle: string;
  photosCount: number;
  sessionId: string;
  stagingNotes?: string;
  turnstileToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  const startedAt = new Date().toISOString();
  const hostname = req.headers.get("host") ?? "unknown";
  const path = new URL(req.url).pathname;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create user-level client to respect RLS
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Create service role client only for transaction updates (legitimately needs elevated privileges)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { files, stagingStyle, photosCount, sessionId, stagingNotes, turnstileToken }: CreditOrderRequest = await req.json();

    // Verify Turnstile CAPTCHA token
    console.log('[process-credit-order] Verifying Turnstile token...');
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      await sendSupportAlert("Credit Order Blocked – Turnstile Failed", {
        hostname,
        path,
        code: 400,
        reason: "turnstile_failed",
      });
      return new Response(
        JSON.stringify({
          error: "Security verification failed. Please try again.",
          code: "CAPTCHA_VERIFICATION_FAILED"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Processing credit order for user ${user.id}: ${photosCount} photos`);
    await logSystemEvent(
      'Credit order processing started',
      'info',
      user.id,
      path,
      { photos_count: photosCount, session_id: sessionId }
    );

    // Validate files count
    if (files.length !== photosCount) {
      throw new Error(`File count mismatch: expected ${photosCount}, got ${files.length}`);
    }

    // Get user profile for email and name
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    // ✅ UPDATED: Atomic deduction now uses user_id (2025-11-04)
    try {
      // STABILITY: Use atomic credit deduction with full audit trail
      console.log(`[process-credit-order] Deducting ${photosCount} credits atomically...`);
      const deductResult = await updateUserCreditsAtomic(
        supabaseAdmin,
        user.id, // Now using user_id instead of email
        -photosCount,
        `Credit order - ${photosCount} photos`,
        undefined // order_id will be added later
      );

      if (!deductResult.success) {
        console.warn('[process-credit-order] Insufficient credits:', deductResult);
        await logSystemEvent(
          'Credit order blocked - insufficient credits',
          'warn',
          user.id,
          path,
          { required: photosCount, error: deductResult.error }
        );
        await sendSupportAlert("Credit Order Blocked – Insufficient Credits", {
          hostname,
          path,
          code: 400,
          reason: "insufficient_credits",
          required: photosCount,
          current: deductResult.previousBalance,
          user_id: user.id,
          email: profileData.email
        });
        return new Response(
          JSON.stringify({
            error: "Insufficient credits",
            required: photosCount,
            available: deductResult.previousBalance
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log(`[process-credit-order] ✓ Credits deducted successfully:`, deductResult);
      await logSystemEvent(
        'Credits deducted for order',
        'info',
        user.id,
        path,
        { 
          amount: photosCount, 
          previous: deductResult.previousBalance,
          new: deductResult.newBalance 
        }
      );

      // Create orders for each file
      const orderPromises = files.map(async (filePath) => {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            original_image_url: filePath,
            staging_style: stagingStyle,
            status: "pending",
            credits_used: 1,
            processing_started: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) throw orderError;
        return orderData;
      });

      const createdOrders = await Promise.all(orderPromises);
      console.log(`✓ Successfully created ${createdOrders.length} orders using ${photosCount} credits`);
      await logSystemEvent(
        'Orders created successfully',
        'info',
        user.id,
        path,
        { order_count: createdOrders.length, session_id: sessionId }
      );

      // Send order notification email
      try {
        await supabase.functions.invoke("send-order-notification", {
          body: {
            sessionId: sessionId,
            orderNumber: createdOrders[0]?.order_number,
            customerName: profileData.name || "Customer",
            customerEmail: profileData.email,
            photosCount: photosCount,
            amountPaid: 0, // Credit order, no payment
            files: files,
            stagingStyle: stagingStyle,
            stagingNotes: stagingNotes,
            paymentMethod: "credits",
          },
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        await logSystemEvent(
          'Order notification email failed',
          'warn',
          user.id,
          path,
          { error: String(emailError) }
        );
        // Don't fail the order if email fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          orders: createdOrders,
          creditsUsed: photosCount,
          remainingCredits: deductResult.newBalance,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } finally {
      // ✅ Locks deprecated - atomicity handled by database (2025-11-04)
      console.log('[process-credit-order] Transaction complete (no lock release needed)');
    }
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const status = err.message === "Unauthorized" ? 401 : 500;
    console.error("[process-credit-order] Server error:", errorMessage);
    
    await logSystemEvent(
      'Credit order processing failed',
      'error',
      undefined,
      path,
      { error: errorMessage, stack: err?.stack }
    );
    
    // Send support alert for order processing failures
    await sendSupportAlert("Credit Order Failure – Action Required", {
      startedAt,
      hostname,
      path,
      method: req.method,
      code: status,
      message: errorMessage,
      stack: err?.stack ?? "",
    });
    
    // Use sanitized error response
    const { sanitizeError } = await import("../_shared/sanitize-error.ts");
    const sanitized = sanitizeError(err, "Unable to process order. Please try again later.");
    
    return new Response(
      JSON.stringify(sanitized),
      {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
