import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NoteStatus } from '@marshall/shared';

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Updated Sprint Planning', description: 'Updated note title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: { type: 'doc', content: [] }, description: 'Updated Tiptap JSON' })
  @IsOptional()
  @IsObject()
  contentJson?: Record<string, any>;

  @ApiPropertyOptional({ example: '<p>Updated notes</p>', description: 'HTML representation' })
  @IsOptional()
  @IsString()
  contentHtml?: string;

  @ApiPropertyOptional({ example: 'Updated notes', description: 'Plain text representation' })
  @IsOptional()
  @IsString()
  contentText?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Folder ID for organizational grouping',
  })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @ApiPropertyOptional({ enum: NoteStatus })
  @IsOptional()
  @IsEnum(NoteStatus)
  status?: NoteStatus;

  @ApiPropertyOptional({ example: ['updated-tag'], description: 'Tags array' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: true, description: 'Pinned state' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Archived state' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
