import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteFolderDto {
  @ApiProperty({ example: 'Work Notes', description: 'Folder name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Parent folder ID',
  })
  @IsOptional()
  @IsUUID()
  parentFolderId?: string | null;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Folder color hex' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'folder', description: 'Icon name' })
  @IsOptional()
  @IsString()
  icon?: string;
}
