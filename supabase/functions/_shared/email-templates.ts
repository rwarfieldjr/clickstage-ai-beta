/**
 * Email Templates for ClickStagePro
 */

export function orderConfirmationEmail(data: {
  customerName: string;
  orderNumber: string;
  photoCount: number;
  stagingStyle: string;
  estimatedCompletion: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .order-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #666;
    }
    .value {
      color: #333;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Order Confirmed!</h1>
    <p style="margin: 10px 0 0 0;">Thank you for choosing ClickStagePro</p>
  </div>

  <div class="content">
    <p>Hi ${data.customerName},</p>

    <p>We've received your order and our AI staging engine is getting to work! Your photos will be transformed into stunning, professionally staged images.</p>

    <div class="order-details">
      <h2 style="margin-top: 0;">Order Details</h2>
      <div class="detail-row">
        <span class="label">Order Number:</span>
        <span class="value">#${data.orderNumber}</span>
      </div>
      <div class="detail-row">
        <span class="label">Photos:</span>
        <span class="value">${data.photoCount} ${data.photoCount === 1 ? 'photo' : 'photos'}</span>
      </div>
      <div class="detail-row">
        <span class="label">Staging Style:</span>
        <span class="value">${data.stagingStyle}</span>
      </div>
      <div class="detail-row">
        <span class="label">Estimated Completion:</span>
        <span class="value">${data.estimatedCompletion}</span>
      </div>
    </div>

    <p><strong>What happens next?</strong></p>
    <ul>
      <li>Our AI will process your images with professional staging</li>
      <li>You'll receive an email when your photos are ready</li>
      <li>Download your staged images from your dashboard</li>
    </ul>

    <center>
      <a href="https://clickstagepro.com/dashboard" class="cta-button">View Order Status</a>
    </center>

    <p>Have questions? Just reply to this email - we're here to help!</p>

    <p>Best regards,<br>The ClickStagePro Team</p>
  </div>

  <div class="footer">
    <p>ClickStagePro - Professional AI Virtual Staging</p>
    <p>© ${new Date().getFullYear()} ClickStagePro. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

export function stagingCompleteEmail(data: {
  customerName: string;
  orderNumber: string;
  photoCount: number;
  downloadUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Staged Photos Are Ready!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .cta-button {
      display: inline-block;
      background: #11998e;
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="success-icon">✨</div>
    <h1 style="margin: 0;">Your Photos Are Ready!</h1>
    <p style="margin: 10px 0 0 0;">Professional staging complete</p>
  </div>

  <div class="content">
    <p>Hi ${data.customerName},</p>

    <p>Great news! Your ${data.photoCount} professionally staged ${data.photoCount === 1 ? 'photo is' : 'photos are'} ready to download.</p>

    <p>Order #${data.orderNumber} has been completed and your stunning, AI-staged images are waiting for you.</p>

    <center>
      <a href="${data.downloadUrl}" class="cta-button">Download Your Photos</a>
    </center>

    <p><strong>What you'll get:</strong></p>
    <ul>
      <li>High-resolution professionally staged images</li>
      <li>Ready to use for listings and marketing</li>
      <li>Lifetime access from your dashboard</li>
    </ul>

    <p><strong>Love the results?</strong> Share your transformation on social media and tag us @ClickStagePro!</p>

    <p>Need more staging? You have <strong>${data.photoCount > 10 ? 'volume' : 'affordable'}</strong> pricing available for your next project.</p>

    <p>Thank you for choosing ClickStagePro!</p>

    <p>Best regards,<br>The ClickStagePro Team</p>
  </div>

  <div class="footer">
    <p>ClickStagePro - Professional AI Virtual Staging</p>
    <p>© ${new Date().getFullYear()} ClickStagePro. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

export function adminAlertEmail(data: {
  alertType: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}): string {
  const colors = {
    error: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const icons = {
    error: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Alert: ${data.title}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: ${colors[data.alertType]};
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .alert-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .details {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13px;
    }
    .detail-row {
      margin: 5px 0;
    }
    .label {
      font-weight: 600;
      color: #666;
    }
    .timestamp {
      color: #999;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="alert-icon">${icons[data.alertType]}</div>
    <h2 style="margin: 0;">${data.title}</h2>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">${data.alertType.toUpperCase()} ALERT</p>
  </div>

  <div class="content">
    <p><strong>Message:</strong></p>
    <p>${data.message}</p>

    ${data.details ? `
    <div class="details">
      <p><strong>Details:</strong></p>
      ${Object.entries(data.details).map(([key, value]) => `
        <div class="detail-row">
          <span class="label">${key}:</span> ${JSON.stringify(value)}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <p class="timestamp">Timestamp: ${data.timestamp}</p>

    <p><em>This is an automated alert from ClickStagePro monitoring system.</em></p>
  </div>
</body>
</html>
  `;
}

export function welcomeEmail(data: {
  customerName: string;
  email: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ClickStagePro!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .feature-box {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin: 10px 0;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Welcome to ClickStagePro! 🎉</h1>
    <p style="margin: 10px 0 0 0;">Transform Your Real Estate Photos with AI</p>
  </div>

  <div class="content">
    <p>Hi ${data.customerName},</p>

    <p>Welcome! We're thrilled to have you join thousands of real estate professionals who trust ClickStagePro for their virtual staging needs.</p>

    <h3>What You Can Do:</h3>

    <div class="feature-box">
      <strong>✨ AI-Powered Staging</strong>
      <p style="margin: 5px 0 0 0;">Upload empty rooms and watch them transform into beautifully furnished spaces in minutes.</p>
    </div>

    <div class="feature-box">
      <strong>🎨 Multiple Styles</strong>
      <p style="margin: 5px 0 0 0;">Choose from Modern, Contemporary, Scandinavian, and more to match your property's aesthetic.</p>
    </div>

    <div class="feature-box">
      <strong>⚡ Lightning Fast</strong>
      <p style="margin: 5px 0 0 0;">Get professional results in minutes, not days. Perfect for tight listing deadlines.</p>
    </div>

    <center>
      <a href="https://clickstagepro.com/upload" class="cta-button">Start Your First Project</a>
    </center>

    <p><strong>Getting Started is Easy:</strong></p>
    <ol>
      <li>Upload your empty room photos</li>
      <li>Select your preferred staging style</li>
      <li>Download your professionally staged images</li>
    </ol>

    <p>Have questions? Our support team is here to help! Just reply to this email.</p>

    <p>Happy staging!</p>

    <p>Best regards,<br>The ClickStagePro Team</p>
  </div>

  <div class="footer">
    <p>ClickStagePro - Professional AI Virtual Staging</p>
    <p>You're receiving this email because you signed up at clickstagepro.com</p>
    <p>© ${new Date().getFullYear()} ClickStagePro. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}