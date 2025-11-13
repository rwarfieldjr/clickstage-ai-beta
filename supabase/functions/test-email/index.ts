import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { sendEmail } from '../_shared/send-email.ts';
import { orderConfirmationEmail, stagingCompleteEmail, adminAlertEmail } from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, testType } = await req.json();

    if (!to) {
      return Response.json(
        { error: 'Email recipient required' },
        { status: 400, headers: corsHeaders }
      );
    }

    let emailHtml: string;
    let emailSubject = subject || 'Test Email from ClickStagePro';

    // Generate test email based on type
    switch (testType) {
      case 'order_confirmation':
        emailHtml = orderConfirmationEmail({
          customerName: 'Test Customer',
          orderNumber: 'TEST12345',
          photoCount: 3,
          stagingStyle: 'Modern',
          estimatedCompletion: '24-48 hours',
        });
        emailSubject = 'Test Order Confirmation';
        break;

      case 'staging_complete':
        emailHtml = stagingCompleteEmail({
          customerName: 'Test Customer',
          orderNumber: 'TEST12345',
          photoCount: 3,
          downloadUrl: 'https://clickstagepro.com/dashboard',
        });
        emailSubject = 'Test Staging Complete';
        break;

      case 'admin_alert':
        emailHtml = adminAlertEmail({
          alertType: 'info',
          title: 'Test Admin Alert',
          message: 'This is a test alert email from the admin test utility.',
          details: {
            test: true,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
        emailSubject = 'Test Admin Alert';
        break;

      default:
        emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #667eea;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
    }
    .content {
      margin-top: 20px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Test Email</h1>
  </div>
  <div class="content">
    <p>This is a test email from ClickStagePro admin tests.</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <p>If you received this email, your email configuration is working correctly!</p>
  </div>
</body>
</html>
        `;
    }

    const result = await sendEmail({
      to,
      subject: emailSubject,
      html: emailHtml,
    });

    if (!result.success) {
      return Response.json(
        { error: result.error },
        { status: 500, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in test-email function:', error);
    return Response.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});