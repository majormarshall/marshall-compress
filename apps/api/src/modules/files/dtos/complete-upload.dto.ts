import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompletedPartDto {
  @ApiProperty({ example: 1, description: '1-indexed part number' })
  @IsInt()
  @IsPositive()
  partNumber!: number;

  @ApiProperty({ example: '"d41d8cd98f00b204e9800998ecf8427e"', description: 'ETag of uploaded part' })
  @IsString()
  @IsNotEmpty()
  etag!: string;
}

export class CompleteUploadDto {
  @ApiProperty({ example: 'upload-id-from-session', description: 'Multipart upload ID' })
  @IsString()
  @IsNotEmpty()
  uploadId!: string;

  @ApiProperty({ example: 'files/user-123/file.pdf', description: 'S3/R2 storage key' })
  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @ApiProperty({ example: 'document.pdf', description: 'File name' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ example: 10485760, description: 'File size in bytes' })
  @IsInt()
  @IsPositive()
  sizeBytes!: number;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Folder ID in which file is placed',
  })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @ApiProperty({ type: [CompletedPartDto], description: 'List of completed parts with ETags' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletedPartDto)
  parts!: CompletedPartDto[];
}
