import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaSendOtpDto {
  @ApiProperty({ example: 'partial-jwt-token' })
  @IsString()
  @IsNotEmpty({ message: 'MFA token is required' })
  mfaToken!: string;
}
