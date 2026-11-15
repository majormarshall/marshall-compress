import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({ description: 'Target plan ID (e.g. pro, enterprise)', example: 'pro' })
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @ApiPropertyOptional({ description: 'Redirect URL upon successful payment' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  successUrl?: string;

  @ApiPropertyOptional({ description: 'Redirect URL upon cancelled payment' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  cancelUrl?: string;
}
