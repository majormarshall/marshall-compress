import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@marshall.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
