import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AIProvider, type AIMessageRole } from '@marshall/shared';

export class AiMessageDto {
  @ApiProperty({ example: 'user', enum: ['system', 'user', 'assistant'] })
  @IsString()
  @IsNotEmpty()
  role!: AIMessageRole;

  @ApiProperty({ example: 'Summarize the key points from this document...' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class AiChatDto {
  @ApiProperty({ type: [AiMessageDto], description: 'Conversation messages' })
  @IsArray()
  messages!: AiMessageDto[];

  @ApiPropertyOptional({
    example: 'OPENAI',
    enum: AIProvider,
    description: 'AI provider to use',
  })
  @IsOptional()
  @IsEnum(AIProvider)
  provider?: AIProvider = AIProvider.OPENAI;

  @ApiPropertyOptional({
    example: 'gpt-4o-mini',
    description: 'Model identifier within the chosen provider',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2048, description: 'Maximum tokens for the response' })
  @IsOptional()
  maxTokens?: number;
}
