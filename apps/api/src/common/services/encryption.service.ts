// apps/api/src/common/services/encryption.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
// const TAG_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>('ENCRYPTION_KEY');
    if (!secret || secret.length < 32) {
      throw new Error(
        'ENCRYPTION_KEY must be at least 32 characters. Add it to your .env file.',
      );
    }
    // Derive a 32-byte key using SHA-256
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  // ── Encrypt ────────────────────────────────────────────────────
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Format: iv:tag:ciphertext (all hex)
    return [
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  // ── Decrypt ────────────────────────────────────────────────────
  decrypt(encryptedData: string): string {
    const [ivHex, tagHex, ciphertextHex] = encryptedData.split(':');

    if (!ivHex || !tagHex || !ciphertextHex) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }
}
