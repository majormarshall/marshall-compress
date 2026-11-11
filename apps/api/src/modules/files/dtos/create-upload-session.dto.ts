import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUploadSessionDto {
  @ApiProperty({ example: 'document.pdf', description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type of file' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ example: 10485760, description: 'File size in bytes' })
  @IsInt()
  @IsPositive()
  sizeBytes!: number;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Folder ID in which to place the file',
  })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @ApiPropertyOptional({ example: 3, description: 'Optional part count override' })
  @IsOptional()
  @IsInt()
  @Min(1)
  partCount?: number;
}
