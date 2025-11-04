import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const NotificationSchema = z.object({
  sessionId: z.string().min(1),
  orderNumber: z.string().min(1).optional(), // Changed to string to accept order numbers like "ORD-000001"
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  photosCount: z.number().int().positive(),
  amountPaid: z.number().nonnegative(), // Allow 0 for credit orders
  files: z.array(z.string()).min(1),
  stagingStyle: z.string().optional(),
  stagingNotes: z.string().optional(),
  paymentMethod: z.string().optional(),
  propertyAddress: z.string().optional(),
});

const sendResendEmail = async (to: string[], subject: string, html: string, from: string) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validation = NotificationSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { sessionId, orderNumber, customerName, customerEmail, photosCount, amountPaid, files, stagingStyle, stagingNotes, paymentMethod, propertyAddress } = validation.data;
    
    // Use orderNumber if provided, otherwise fallback to sessionId slice
    const displayOrderNumber = orderNumber || sessionId.slice(-20);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Create Supabase client for generating signed URLs
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    // Generate signed URLs for the uploaded images (valid for 7 days)
    const imageUrlPromises = files.map(async (file) => {
      const { data, error } = await supabase.storage
        .from('original-images')
        .createSignedUrl(file, 604800); // 7 days in seconds
      
      if (error) {
        console.error(`Error generating signed URL for ${file}:`, error);
        return { file, url: null };
      }
      
      return { file, url: data.signedUrl };
    });
    
    const imageUrlResults = await Promise.all(imageUrlPromises);
    const imageUrls = imageUrlResults.filter(result => result.url !== null);

    // Send confirmation email to customer
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Thank You for Your Order!</h1>
          <p style="color: white; margin: 10px 0 0 0;">ClickStage Pro Virtual Staging</p>
        </div>
        
        <div style="padding: 40px; background: #f7fafc;">
          <p style="font-size: 16px; color: #2d3748;">Hi ${customerName},</p>
          
          <p style="font-size: 16px; color: #2d3748;">
            Thank you for choosing ClickStage Pro! We've received your order and our team 
            will begin processing your virtual staging request right away.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #667eea; margin-top: 0;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>Order Number:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">#${displayOrderNumber}</td>
              </tr>
              ${stagingStyle ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>Staging Style:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${stagingStyle.replace(/-/g, ' ')}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>Photos Count:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${photosCount} photo${photosCount > 1 ? 's' : ''}</td>
              </tr>
              ${paymentMethod === 'credits' ? `
              <tr>
                <td style="padding: 10px 0;"><strong>Payment Method:</strong></td>
                <td style="padding: 10px 0;">Credits (${photosCount} credits used)</td>
              </tr>
              ` : `
              <tr>
                <td style="padding: 10px 0;"><strong>Total Paid:</strong></td>
                <td style="padding: 10px 0;">$${amountPaid.toFixed(2)}</td>
              </tr>
              `}
            </table>
          </div>

          ${stagingNotes ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">📝 Your Special Notes</h3>
            <p style="color: #2d3748; margin: 0;">${stagingNotes}</p>
          </div>
          ` : ''}

          <div style="background: #ebf4ff; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">What Happens Next?</h3>
            <ol style="margin: 10px 0; padding-left: 20px; color: #2d3748;">
              <li style="margin-bottom: 10px;">Our team will review your uploaded photos</li>
              <li style="margin-bottom: 10px;">We'll create stunning virtually staged images</li>
              <li style="margin-bottom: 10px;">You'll receive your staged photos within 24-48 hours</li>
              <li>Download your images from your account dashboard</li>
            </ol>
          </div>

          <p style="font-size: 16px; color: #2d3748;">
            You can track your order status and download completed images from your 
            <a href="${req.headers.get("origin") || "https://clickstagepro.lovable.app"}/dashboard" 
               style="color: #667eea; text-decoration: none; font-weight: bold;">account dashboard</a>.
          </p>

          <p style="font-size: 14px; color: #718096; margin-top: 30px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>

          <p style="font-size: 16px; color: #2d3748; margin-top: 30px;">
            Best regards,<br>
            <strong>The ClickStage Pro Team</strong>
          </p>
        </div>
      </div>
    `;

    await sendResendEmail(
      [customerEmail],
      `Order Confirmation #${displayOrderNumber} - ClickStage Pro`,
      customerEmailHtml,
      "ClickStage Pro <noreply@clickstagepro.com>"
    );

    // Send notification email to admin/team
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Order Received - Action Required</h1>
        </div>
        
        <div style="padding: 30px; background: #1f2937; color: white;">
          <h2 style="color: #fbbf24; margin-top: 0;">Order #${displayOrderNumber}</h2>
          
          <div style="background: #374151; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
            ${propertyAddress ? `<p style="margin: 5px 0;"><strong>Property Address:</strong> ${propertyAddress}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Photos to Stage:</strong> ${photosCount}</p>
            ${paymentMethod === 'credits' 
              ? `<p style="margin: 5px 0;"><strong>Payment Method:</strong> Credits (${photosCount} credits used)</p>`
              : `<p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${amountPaid.toFixed(2)}</p>`
            }
            ${stagingStyle ? `<p style="margin: 5px 0;"><strong>Staging Style:</strong> <span style="text-transform: capitalize;">${stagingStyle.replace(/-/g, ' ')}</span></p>` : ''}
            ${stagingNotes ? `<p style="margin: 5px 0;"><strong>Special Notes:</strong> ${stagingNotes}</p>` : ''}
          </div>

          <div style="background: #1e40af; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: white; margin-top: 0;">📸 Download Original Photos</h3>
            <p style="color: #93c5fd; margin-bottom: 15px;">
              Click the links below to download the uploaded photos:
            </p>
            ${imageUrls.map((result, index) => `
              <div style="margin: 10px 0;">
                <a href="${result.url}" 
                   target="_blank"
                   style="color: #60a5fa; text-decoration: underline; word-break: break-all;">
                   📥 Download Photo ${index + 1}
                </a>
                <span style="color: #9ca3af; font-size: 12px; display: block; margin-top: 5px;">
                  Link expires in 7 days
                </span>
              </div>
            `).join('')}
          </div>

          <div style="background: #374151; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #fbbf24; margin-top: 0;">Next Steps:</h3>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li style="margin-bottom: 10px;">Click the download links above to get the original photos</li>
              <li style="margin-bottom: 10px;">Stage the photos professionally using your staging software</li>
              <li style="margin-bottom: 10px;">Upload completed staged images to the staging system</li>
              <li>Update the order status in the admin dashboard</li>
            </ol>
          </div>

          <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
            This is an automated notification. Please process this order within 24-48 hours.
          </p>
        </div>
      </div>
    `;

    const adminEmails = (Deno.env.get("ADMIN_NOTIFICATION_EMAILS") || "orders@clickstagepro.com").split(",").map(e => e.trim());
    await sendResendEmail(
      adminEmails,
      `NEW ORDER #${displayOrderNumber} - Action Required`,
      adminEmailHtml,
      "ClickStage Pro <noreply@clickstagepro.com>"
    );

    console.log(`Notification emails sent for order ${sessionId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[send-order-notification] Server error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unable to send notification. Please contact support.",
        code: "NOTIFICATION_ERROR"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
