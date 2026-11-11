import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompressionPreset } from '@marshall/shared';

export class CompressionSettingsDto {
  @ApiPropertyOptional({ enum: CompressionPreset, default: CompressionPreset.BALANCED })
  @IsOptional()
  @IsEnum(CompressionPreset)
  preset?: CompressionPreset;

  @ApiPropertyOptional({ example: 80, minimum: 1, maximum: 100, description: 'Output quality 1-100' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional({ example: false, description: 'Lossless compression flag' })
  @IsOptional()
  @IsBoolean()
  lossless?: boolean;

  @ApiPropertyOptional({ example: 500, description: 'Target output size in KB' })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetSizeKb?: number;

  @ApiPropertyOptional({ example: 'webp', description: 'Desired output format' })
  @IsOptional()
  @IsString()
  outputFormat?: string;

  @ApiPropertyOptional({ example: true, description: 'Strip EXIF / metadata' })
  @IsOptional()
  @IsBoolean()
  stripMetadata?: boolean;
}

export class CreateCompressionJobDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the file to compress',
  })
  @IsUUID()
  @IsNotEmpty()
  fileId!: string;

  @ApiPropertyOptional({ enum: CompressionPreset, default: CompressionPreset.BALANCED })
  @IsOptional()
  @IsEnum(CompressionPreset)
  preset?: CompressionPreset;

  @ApiPropertyOptional({ type: CompressionSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompressionSettingsDto)
  settings?: CompressionSettingsDto;
}
