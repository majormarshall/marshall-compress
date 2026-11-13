import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFileDto {
  @ApiPropertyOptional({ description: 'New name for the file' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Target folder ID, or null to move to root directory' })
  @IsOptional()
  @IsString()
  folderId?: string | null;
}
