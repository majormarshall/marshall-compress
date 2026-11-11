import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListFoldersQueryDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Parent folder ID filter (null or "root" for top-level folders)',
  })
  @IsOptional()
  @IsString()
  parentId?: string | null;
}
