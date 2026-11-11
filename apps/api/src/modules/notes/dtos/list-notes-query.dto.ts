import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NoteStatus } from '@marshall/shared';

export class ListNotesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Filter by folder ID' })
  @IsOptional()
  @IsString()
  folderId?: string | null;

  @ApiPropertyOptional({ enum: NoteStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(NoteStatus)
  status?: NoteStatus;

  @ApiPropertyOptional({ example: true, description: 'Filter by pinned state' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ example: 'planning', description: 'Full-text search query across notes' })
  @IsOptional()
  @IsString()
  search?: string;
}
