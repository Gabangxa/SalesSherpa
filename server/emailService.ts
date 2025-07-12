import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email functionality will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@salesherpa.com'; // You can change this to your verified sender email

export interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured - email not sent');
    return false;
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from || FROM_EMAIL,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
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
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  return {
    to: '', // Will be filled by caller
    subject: 'Verify Your Sales Sherpa Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Sales Sherpa Account</title>
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
          <div class="header">
            <h1>Welcome to Sales Sherpa!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thanks for signing up for Sales Sherpa! We're excited to help you achieve your sales goals with personalized accountability and guidance.</p>
            
            <p>To get started, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify My Email</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${verificationUrl}
            </p>
            
            <p>This verification link will expire in 24 hours for security purposes.</p>
            
            <p>If you didn't create an account with Sales Sherpa, please ignore this email.</p>
            
            <p>Best regards,<br>The Sales Sherpa Team</p>
          </div>
          <div class="footer">
            <p>© 2025 Sales Sherpa. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      Thanks for signing up for Sales Sherpa! 
      
      To verify your email address, please visit: ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with Sales Sherpa, please ignore this email.
      
      Best regards,
      The Sales Sherpa Team
    `
  };
}