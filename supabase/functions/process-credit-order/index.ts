import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { verifyTurnstile } from "../_shared/verify-turnstile.ts";
import { sendSupportAlert } from "../_shared/support-alert.ts";

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

    // Get current credits from user_credits table using RPC for atomic deduction
    const { data: deductResult, error: creditError } = await supabase.rpc(
      "deduct_credits_if_available",
      {
        email_param: profileData.email,
        amount_param: photosCount,
      }
    );

    if (creditError) {
      throw new Error("Failed to deduct credits");
    }

    const result = deductResult as { success: boolean };
    if (!result?.success) {
      await sendSupportAlert("Credit Order Blocked – Insufficient Credits", {
        hostname,
        path,
        code: 400,
        reason: "insufficient_credits",
        required: photosCount,
        user_id: user.id,
      });
      return new Response(
        JSON.stringify({
          error: "Insufficient credits",
          required: photosCount,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get updated credit balance
    const { data: updatedCredits } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("email", profileData.email)
      .single();

    // Deduct credits from non-expired transactions (FIFO) using admin client for transaction updates
    let creditsToDeduct = photosCount;
    const { data: transactions, error: transError } = await supabaseAdmin
      .from("credits_transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("transaction_type", "purchase")
      .gt("amount", 0)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: true });

    if (transError) throw transError;

    // Deduct from oldest transactions first
    for (const transaction of transactions || []) {
      if (creditsToDeduct <= 0) break;

      const deductAmount = Math.min(transaction.amount, creditsToDeduct);
      
      // Update the transaction using admin client
      const { error: updateError } = await supabaseAdmin
        .from("credits_transactions")
        .update({ amount: transaction.amount - deductAmount })
        .eq("id", transaction.id);

      if (updateError) throw updateError;

      creditsToDeduct -= deductAmount;
    }

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
        })
        .select()
        .single();

      if (orderError) throw orderError;
      return orderData;
    });

    const createdOrders = await Promise.all(orderPromises);

    // Record the credit usage transaction (user-level client respects RLS)
    const { error: transactionError } = await supabase
      .from("credits_transactions")
      .insert({
        user_id: user.id,
        amount: -photosCount,
        transaction_type: "usage",
        description: `Used ${photosCount} credits for virtual staging`,
      });

    if (transactionError) throw transactionError;

    console.log(`Successfully created ${createdOrders.length} orders using ${photosCount} credits`);

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
      // Don't fail the order if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        orders: createdOrders,
        creditsUsed: photosCount,
        remainingCredits: updatedCredits?.credits || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const status = err.message === "Unauthorized" ? 401 : 500;
    console.error("[process-credit-order] Server error:", errorMessage);
    
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
