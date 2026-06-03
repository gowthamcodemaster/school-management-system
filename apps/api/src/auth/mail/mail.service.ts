// apps/api/src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST') ?? 'localhost',
      port: this.config.get<number>('MAIL_PORT') ?? 1025,
      secure: false, // Mailhog doesn't use TLS
      ignoreTLS: true,
    });
  }

  async sendOtp(email: string, code: string): Promise<void> {
    const from =
      this.config.get<string>('MAIL_FROM') ?? 'noreply@vidyadhara.com';

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Your Vidya Dhara verification code',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #16a34a; margin-bottom: 8px;">Vidya Dhara</h2>
          <p style="color: #475569; margin-bottom: 24px;">Your verification code is:</p>
          <div style="
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin-bottom: 24px;
          ">
            <span style="
              font-size: 2.5rem;
              font-weight: 700;
              letter-spacing: 0.25em;
              color: #15803d;
              font-family: monospace;
            ">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 0.875rem;">
            This code expires in <strong>10 minutes</strong>. 
            Do not share this code with anyone.
          </p>
          <p style="color: #94a3b8; font-size: 0.75rem; margin-top: 24px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
      text: `Your Vidya Dhara verification code is: ${code}. It expires in 10 minutes.`,
    });

    this.logger.log(`OTP email sent to ${email}`);
  }
}
