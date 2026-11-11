import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFolderDto {
  @ApiPropertyOptional({ example: 'Renamed Documents', description: 'New folder name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'New parent folder ID (null to move to root)',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
