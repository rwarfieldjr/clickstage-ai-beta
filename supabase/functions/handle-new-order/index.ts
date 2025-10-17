import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HandleNewOrderRequest {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  staging_style?: string;
  photos_count: number;
  total_amount: number;
  files?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      name, 
      firstName, 
      lastName, 
      phone, 
      staging_style, 
      photos_count, 
      total_amount,
      files
    }: HandleNewOrderRequest = await req.json();

    console.log("Processing new order notification for:", email);

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Resend client
    const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

    // Generate signed URL for the first file if files exist
    let downloadLink = "";
    if (files && files.length > 0) {
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
        .storage
        .from("original-images")
        .createSignedUrl(files[0], 604800); // 7 days expiration

      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
      } else {
        downloadLink = signedUrlData.signedUrl;
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users.some(u => u.email === email);

    // Generate magic link for password setup
    console.log("Generating magic link for:", email);
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError) {
      console.error("Error generating magic link:", linkError);
      throw linkError;
    }

    const actionLink = linkData.properties?.action_link || "";
    console.log("Magic link generated successfully");

    // Get order numbers for this customer
    const { data: ordersData } = await supabaseAdmin
      .from("orders")
      .select("order_number")
      .eq("user_id", existingUser?.users.find(u => u.email === email)?.id || "")
      .order("created_at", { ascending: false })
      .limit(photos_count);

    const orderNumbers = ordersData?.map(o => o.order_number).join(", ") || "Processing";

    // Send customer confirmation email
    console.log("Sending customer email to:", email);
    const { error: customerEmailError } = await resend.emails.send({
      from: "ClickStage Pro <noreply@clickstagepro.com>",
      to: email,
      subject: "Thank You for Your Order!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px;">
          <div style="background: white; border-radius: 8px; padding: 30px;">
            <h1 style="color: #333; text-align: center; margin-bottom: 20px;">Thank You for Your Order!</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
              ClickStage Pro Virtual Staging
            </p>
            
            <p style="color: #555; line-height: 1.6;">Hi ${name},</p>
            
            <p style="color: #555; line-height: 1.6;">
              Thank you for choosing ClickStage Pro! We've received your order and our team will begin processing your virtual staging request right away.
            </p>

            <div style="background-color: #1a1a1a; color: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h2 style="color: #667eea; margin-top: 0; margin-bottom: 15px;">Order Details</h2>
              ${orderNumbers !== "Processing" ? `<p style="margin: 8px 0;"><strong>Order Number:</strong> ${orderNumbers}</p>` : ''}
              ${staging_style ? `<p style="margin: 8px 0;"><strong>Staging Style:</strong> ${staging_style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>` : ''}
              <p style="margin: 8px 0;"><strong>Credit Pack:</strong> ${photos_count} credit${photos_count > 1 ? 's' : ''}</p>
              <p style="margin: 8px 0;"><strong>Total Paid:</strong> $${(total_amount / 100).toFixed(2)}</p>
            </div>

            <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0;">
              <h3 style="color: #333; margin-top: 0;">What Happens Next?</h3>
              <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
                <li>Our team will review your uploaded photos</li>
                <li>We'll create stunning virtually staged images</li>
                <li>You'll receive your staged photos within 24-48 hours</li>
                <li>Download your images from your account dashboard</li>
              </ol>
            </div>

            ${!userExists ? `
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
              <p style="color: #555; margin-bottom: 15px; font-weight: bold;">We've created your account — set your password to access your dashboard:</p>
              <a href="${actionLink}" 
                 style="background-color: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Create My Password →
              </a>
            </div>
            ` : ''}

            <p style="color: #555; margin-top: 30px;">
              You can track your order status and download completed images from your <a href="https://clickstagepro.com/dashboard" style="color: #667eea; text-decoration: none;">account dashboard</a>.
            </p>

            <p style="color: #555; margin-top: 20px;">
              If you have any questions, please don't hesitate to contact our support team.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #888; font-size: 14px; text-align: center;">
              Best regards,<br>
              <strong>The ClickStage Pro Team</strong><br>
              <a href="https://www.clickstagepro.com" style="color: #667eea; text-decoration: none;">www.ClickStagePro.com</a>
            </p>
          </div>
        </div>
      `,
    });

    if (customerEmailError) {
      console.error("Error sending customer email:", customerEmailError);
    } else {
      console.log("Customer email sent successfully");
    }

    // Generate signed URLs for admin access (48 hour expiry)
    let signedUrlsHtml = '';
    if (files && files.length > 0) {
      const signedUrls = await Promise.all(
        files.map(async (file) => {
          const { data, error } = await supabaseAdmin.storage
            .from('original-images')
            .createSignedUrl(file, 172800); // 48 hours
          
          if (error) {
            console.error(`Error creating signed URL for ${file}:`, error);
            return null;
          }
          return { file, url: data.signedUrl };
        })
      );

      const validUrls = signedUrls.filter(item => item !== null);
      
      if (validUrls.length > 0) {
        signedUrlsHtml = `
        <div style="background-color: #2d3748; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #667eea; margin-top: 0;">📸 Download Original Photos</h3>
          <p style="margin-bottom: 15px; font-size: 14px;">Secure links (valid for 48 hours):</p>
          <ul style="list-style: none; padding: 0;">
            ${validUrls.map((item, idx) => `
              <li style="margin-bottom: 10px;">
                <a href="${item.url}" 
                   style="color: #667eea; word-break: break-all; font-size: 13px;">
                  Photo ${idx + 1}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
        `;
      }
    }

    // Send admin notification email
    const { error: adminEmailError } = await resend.emails.send({
      from: "ClickStage Pro <noreply@clickstagepro.com>",
      to: "orders@clickstagepro.com",
      subject: `New Order Received - Action Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">New Order Received - Action Required</h1>
          </div>
          
          <div style="background-color: #1a1a1a; color: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #667eea; margin-top: 0;">Order #${orderNumbers}</h2>
            
            <p style="margin-bottom: 20px;"><strong>Customer:</strong> ${firstName} ${lastName}</p>
            <p style="margin-bottom: 20px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #667eea;">${email}</a></p>
            ${phone ? `<p style="margin-bottom: 20px;"><strong>Phone:</strong> ${phone}</p>` : ''}
            
            <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;">
            
            <p style="margin-bottom: 10px;"><strong>Photos to Stage:</strong> ${photos_count}</p>
            ${staging_style ? `<p style="margin-bottom: 10px;"><strong>Staging Style:</strong> ${staging_style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>` : ''}
            <p style="margin-bottom: 20px;"><strong>Amount Paid:</strong> $${(total_amount / 100).toFixed(2)}</p>
            
            ${signedUrlsHtml}

            <div style="background-color: #065f46; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Next Steps:</h3>
              <ol style="padding-left: 20px; line-height: 1.8;">
                <li>Click the secure download links above to get original photos</li>
                <li>Stage the photos professionally</li>
                <li>Upload completed images to the admin dashboard</li>
                <li>Mark order as completed</li>
              </ol>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://clickstagepro.com/admin/dashboard" 
                 style="background-color: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View in Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
    });

    if (adminEmailError) {
      console.error("Error sending admin email:", adminEmailError);
    } else {
      console.log("Admin email sent successfully");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails_sent: true,
        user_existed: userExists
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ 
        received: true, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});