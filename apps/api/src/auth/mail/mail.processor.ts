// apps/api/src/mail/mail.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';

export const MAIL_QUEUE = 'mail';
export const SEND_OTP_JOB = 'send-otp';

export interface SendOtpJobData {
  email: string;
  code: string;
}

@Processor(MAIL_QUEUE)
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process(SEND_OTP_JOB)
  async handleSendOtp(job: Job<SendOtpJobData>): Promise<void> {
    const start = Date.now();
    const { email, code } = job.data;

    try {
      await this.mailService.sendOtp(email, code);
      this.logger.log(
        `✅ OTP email delivered to ${email} in ${Date.now() - start}ms`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to deliver OTP email to ${email}: ${(error as Error).message}`,
      );
      throw error; // Bull will retry
    }
  }
}
