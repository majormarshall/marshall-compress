import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'NewSecurePassword123!', minLength: 8, description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
