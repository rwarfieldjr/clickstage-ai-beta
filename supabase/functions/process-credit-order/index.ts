import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { files, stagingStyle, photosCount, sessionId, stagingNotes }: CreditOrderRequest = await req.json();

    console.log(`Processing credit order for user ${user.id}: ${photosCount} photos`);

    // Validate files count
    if (files.length !== photosCount) {
      throw new Error(`File count mismatch: expected ${photosCount}, got ${files.length}`);
    }

    // Get user's current credits and profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("credits, email, name")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    const currentCredits = profileData?.credits || 0;

    // Check if user has enough credits
    if (currentCredits < photosCount) {
      return new Response(
        JSON.stringify({
          error: "Insufficient credits",
          required: photosCount,
          available: currentCredits,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Deduct credits from non-expired transactions (FIFO)
    let creditsToDeduct = photosCount;
    const { data: transactions, error: transError } = await supabase
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
      
      // Update the transaction
      const { error: updateError } = await supabase
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

    // Record the credit usage transaction
    const { error: transactionError } = await supabase
      .from("credits_transactions")
      .insert({
        user_id: user.id,
        amount: -photosCount,
        transaction_type: "usage",
        description: `Used ${photosCount} credits for virtual staging`,
      });

    if (transactionError) throw transactionError;

    // Update user's total credits
    const { error: updateCreditsError } = await supabase
      .from("profiles")
      .update({ credits: currentCredits - photosCount })
      .eq("id", user.id);

    if (updateCreditsError) throw updateCreditsError;

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
        remainingCredits: currentCredits - photosCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in process-credit-order function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString(),
      }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
