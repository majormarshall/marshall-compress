import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MeetingProvider } from '@marshall/shared';

export class CreateMeetingDto {
  @ApiProperty({ example: 'Product Roadmap Review', description: 'Title of the meeting' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Discussion on Q3 features and timeline', description: 'Meeting description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-11-12T10:00:00Z', description: 'Scheduled start timestamp' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    example: 'MANUAL_UPLOAD',
    enum: ['ZOOM', 'GOOGLE_MEET', 'MANUAL_UPLOAD'],
    description: 'Platform origin of the meeting',
  })
  @IsOptional()
  @IsString()
  provider?: MeetingProvider;

  @ApiPropertyOptional({ example: 'recordings/user-123/meeting.mp4', description: 'S3/R2 storage key for audio/video recording' })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiPropertyOptional({ example: 52428800, description: 'Recording size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;

  @ApiPropertyOptional({ example: 1800, description: 'Duration in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
