import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExpiringCredit {
  user_id: string;
  email: string;
  name: string;
  amount: number;
  expires_at: string;
  days_until_expiry: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Starting expiring credits check...");

    // Get credits expiring in 30 days and 7 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Query credits_transactions for expiring credits
    const { data: expiringCredits, error: queryError } = await supabase
      .from("credits_transactions")
      .select(`
        user_id,
        amount,
        expires_at,
        profiles!inner(email, name)
      `)
      .not("expires_at", "is", null)
      .gte("expires_at", new Date().toISOString())
      .lte("expires_at", thirtyDaysFromNow.toISOString())
      .eq("transaction_type", "purchase");

    if (queryError) {
      console.error("Error querying expiring credits:", queryError);
      throw queryError;
    }

    console.log(`Found ${expiringCredits?.length || 0} transactions with expiring credits`);

    if (!expiringCredits || expiringCredits.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No expiring credits found",
          processed: 0 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Group credits by user and calculate totals
    const userCredits: Map<string, ExpiringCredit[]> = new Map();
    
    for (const credit of expiringCredits) {
      const profile = credit.profiles as any;
      const expiresAt = new Date(credit.expires_at);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      const creditInfo: ExpiringCredit = {
        user_id: credit.user_id,
        email: profile.email,
        name: profile.name || "Customer",
        amount: credit.amount,
        expires_at: credit.expires_at,
        days_until_expiry: daysUntilExpiry,
      };

      if (!userCredits.has(credit.user_id)) {
        userCredits.set(credit.user_id, []);
      }
      userCredits.get(credit.user_id)!.push(creditInfo);
    }

    console.log(`Grouped into ${userCredits.size} unique users`);

    // Send emails to users
    const emailPromises: Promise<any>[] = [];
    let emailsSent = 0;

    for (const [userId, credits] of userCredits.entries()) {
      const totalExpiring = credits.reduce((sum, c) => sum + c.amount, 0);
      const nearestExpiry = Math.min(...credits.map(c => c.days_until_expiry));
      const userEmail = credits[0].email;
      const userName = credits[0].name;

      // Determine if we should send 30-day or 7-day warning
      const shouldSend30Day = nearestExpiry <= 30 && nearestExpiry > 7;
      const shouldSend7Day = nearestExpiry <= 7;

      if (shouldSend30Day || shouldSend7Day) {
        const daysText = shouldSend7Day ? "7 days" : "30 days";
        const urgencyText = shouldSend7Day ? "soon!" : "in one month.";

        emailPromises.push(
          resend.emails.send({
            from: "ClickStage Pro <notifications@clickstagepro.com>",
            to: [userEmail],
            subject: `⏰ Your ${totalExpiring} ClickStage Pro Credits Expire ${urgencyText}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Credit Expiration Reminder</h1>
                <p>Hi ${userName},</p>
                <p>This is a friendly reminder that you have <strong>${totalExpiring} credits</strong> that will expire in approximately <strong>${daysText}</strong>.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">Credit Details:</h3>
                  ${credits.map(c => `
                    <p style="margin: 5px 0;">
                      ${c.amount} credits expire on ${new Date(c.expires_at).toLocaleDateString()}
                    </p>
                  `).join('')}
                </div>

                <p style="color: ${shouldSend7Day ? '#dc2626' : '#059669'}; font-weight: bold;">
                  ${shouldSend7Day 
                    ? '⚠️ Act fast! Your credits will expire very soon.' 
                    : '💡 Use your credits before they expire!'}
                </p>
                
                <p>To use your credits, simply:</p>
                <ol>
                  <li>Visit our <a href="https://www.clickstagepro.com/upload" style="color: #2563eb;">Upload page</a></li>
                  <li>Select "Pay with Credits" when placing your order</li>
                  <li>Upload your photos and enjoy professional staging!</li>
                </ol>

                <div style="margin: 30px 0;">
                  <a href="https://www.clickstagepro.com/upload" 
                     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Use My Credits Now
                  </a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                  Need help? Contact us at <a href="mailto:support@clickstagepro.com">support@clickstagepro.com</a>
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px;">
                  You received this email because you have expiring credits on your ClickStage Pro account.
                </p>
              </div>
            `,
          })
        );
        emailsSent++;
      }
    }

    await Promise.all(emailPromises);
    console.log(`Successfully sent ${emailsSent} expiration reminder emails`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${userCredits.size} users`,
        emailsSent: emailsSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-expiring-credits function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
