import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AIProvider } from '@marshall/shared';

export class AiSummarizeDto {
  @ApiProperty({ description: 'Text content to summarize', maxLength: 100000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  text!: string;

  @ApiPropertyOptional({
    description: 'Focus or lens for the summary (e.g. "action items", "key decisions")',
  })
  @IsOptional()
  @IsString()
  focus?: string;

  @ApiPropertyOptional({ example: 'OPENAI', enum: AIProvider })
  @IsOptional()
  @IsEnum(AIProvider)
  provider?: AIProvider = AIProvider.OPENAI;

  @ApiPropertyOptional({ example: 'gpt-4o-mini' })
  @IsOptional()
  @IsString()
  model?: string;
}
