import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';

export const getCookieOptions = (config: ConfigService): CookieOptions => ({
  httpOnly: true,
  secure: config.get<string>('NODE_ENV') === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth',
});
