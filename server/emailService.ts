import crypto from 'crypto';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

if (!process.env.BREVO_API_KEY) {
  console.warn('[email] BREVO_API_KEY not set — email functionality will be disabled');
}

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@sales-sherpa.org';
const FROM_NAME  = process.env.BREVO_FROM_NAME  || 'SalesSherpa';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY not set — email not sent');
    return false;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        textContent: params.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Brevo error ${res.status}: ${body}`);
      return false;
    }

    console.log(`[email] Sent "${params.subject}" to ${params.to}`);
    return true;
  } catch (error) {
    console.error('[email] Brevo send error:', error);
    return false;
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateVerificationEmail(
  name: string,
  verificationToken: string,
  baseUrl: string
): EmailParams {
  const verificationUrl = `${baseUrl}/api/verify-email?token=${verificationToken}`;
  const safeName = escapeHtml(name);

  return {
    to: '',
    subject: 'Verify your SalesSherpa account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4d6aff 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #4d6aff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Welcome to SalesSherpa!</h1></div>
          <div class="content">
            <h2>Hi ${safeName},</h2>
            <p>Thanks for signing up! Click below to verify your email address:</p>
            <div style="text-align:center">
              <a href="${verificationUrl}" class="button">Verify my email</a>
            </div>
            <p style="word-break:break-all;background:#f5f5f5;padding:10px;border-radius:4px;font-family:monospace;font-size:13px">${verificationUrl}</p>
            <p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
            <p>— The SalesSherpa team</p>
          </div>
          <div class="footer"><p>© 2025 SalesSherpa. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name},\n\nVerify your SalesSherpa account:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\n— The SalesSherpa team`,
  };
}

export function generateMagicLinkEmail(
  name: string,
  token: string,
  baseUrl: string
): EmailParams {
  const magicUrl = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;
  const safeName = escapeHtml(name);

  return {
    to: '',
    subject: 'Your SalesSherpa sign-in link',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4d6aff 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #4d6aff; color: white; padding: 14px 36px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .expiry { background: #f5f5f5; border-radius: 6px; padding: 10px 14px; font-size: 13px; color: #666; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>SalesSherpa</h1></div>
          <div class="content">
            <h2>Hi ${safeName},</h2>
            <p>Click the button below to sign in. No password needed.</p>
            <div style="text-align:center">
              <a href="${magicUrl}" class="button">Sign in to SalesSherpa</a>
            </div>
            <p style="word-break:break-all;background:#f5f5f5;padding:10px;border-radius:4px;font-family:monospace;font-size:13px">${magicUrl}</p>
            <div class="expiry">⏱ This link expires in 15 minutes and can only be used once. If you didn't request this, you can safely ignore it.</div>
            <p style="margin-top:20px">— The SalesSherpa team</p>
          </div>
          <div class="footer"><p>© 2025 SalesSherpa. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name},\n\nSign in to SalesSherpa:\n${magicUrl}\n\nThis link expires in 15 minutes and can only be used once.\n\n— The SalesSherpa team`,
  };
}
