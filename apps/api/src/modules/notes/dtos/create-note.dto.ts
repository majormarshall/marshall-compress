import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteStatus } from '@marshall/shared';

export class CreateNoteDto {
  @ApiProperty({ example: 'Sprint Planning Notes', description: 'Title of the note' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: { type: 'doc', content: [] }, description: 'Tiptap JSON document' })
  @IsOptional()
  @IsObject()
  contentJson?: Record<string, any>;

  @ApiPropertyOptional({ example: '<p>Meeting notes content</p>', description: 'HTML representation' })
  @IsOptional()
  @IsString()
  contentHtml?: string;

  @ApiPropertyOptional({ example: 'Meeting notes content', description: 'Plain text representation' })
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

  @ApiPropertyOptional({ enum: NoteStatus, default: NoteStatus.DRAFT })
  @IsOptional()
  @IsEnum(NoteStatus)
  status?: NoteStatus;

  @ApiPropertyOptional({ example: ['work', 'planning'], description: 'Tags array' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: false, description: 'Pinned status' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
