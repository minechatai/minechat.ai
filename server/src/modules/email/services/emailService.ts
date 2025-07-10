import nodemailer from 'nodemailer';

// This keeps email functionality separate and reusable!
export interface EmailService {
  sendConfirmationEmail(userEmail: string, userName: string): Promise<boolean>;
}

export class ProductionEmailService implements EmailService {
  private transporter: any;

  constructor() {
    // Gmail SMTP configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not regular password!)
      },
    });
  }

  async sendConfirmationEmail(userEmail: string, userName: string): Promise<boolean> {
    try {
      console.log(`📧 Sending confirmation email to: ${userEmail}`);

      const mailOptions = {
        from: `"Minechat AI" <${process.env.GMAIL_USER}>`,
        to: userEmail,
        subject: '🎉 Welcome to Minechat AI - Account Created Successfully!',
        html: this.getConfirmationEmailTemplate(userName),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${userEmail}:`, result.messageId);
      return true;
    } catch (error) {
      console.error("❌ Failed to send confirmation email:", error);
      return false;
    }
  }

  private getConfirmationEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Minechat AI</title>
      </head>
      <body style="font-family: SF Pro, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Minechat AI!</h1>
        </div>

        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">Hi ${userName}!</h2>

          <p style="font-size: 16px; margin-bottom: 20px;">
            🚀 Your Minechat AI account has been created successfully! You're now ready to automate your business processes and engage with your customers like never before. 
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">What's Next?</h3>
            <ul style="padding-left: 20px;">
              <li>✨ Customize your AI assistant with your business information and FAQs.</li>
              <li>🤖 Deploy your AI assistant across social media channels (Facebook, Instagram, Telegram).</li>
              <li>📊 Track conversations and analytics.</li>
              <li>💼 Automate lead qualification and follow-ups.</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'https://your-app-url.com'}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Get Started Now 🚀
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

          <p style="font-size: 14px; color: #666; text-align: center;">
            Need help? Reply to this email or contact us at support@minechat.ai
          </p>

          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} Minechat AI. Automate the mundane, amplify the human.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new ProductionEmailService();