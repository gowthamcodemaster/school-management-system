import { IsString, IsNotEmpty, Length, Matches, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MfaMethod } from '@prisma/client';

export class MfaVerifyDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'Code is required' })
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  @Matches(/^\d+$/, { message: 'Code must contain only numbers' })
  code!: string;

  @ApiProperty({ example: 'partial-jwt-token' })
  @IsString()
  @IsNotEmpty({ message: 'MFA token is required' })
  mfaToken!: string;

  @ApiProperty({ enum: MfaMethod })
  @IsEnum(MfaMethod)
  method!: MfaMethod;
}
