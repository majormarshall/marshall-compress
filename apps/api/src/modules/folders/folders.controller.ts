import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dtos/create-folder.dto';
import { UpdateFolderDto } from './dtos/update-folder.dto';
import { ListFoldersQueryDto } from './dtos/list-folders-query.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Folders')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  @ApiOperation({ summary: 'List folders by parentId' })
  @SwaggerApiResponse({ status: 200, description: 'List of folders' })
  async listFolders(
    @CurrentUser('id') userId: string,
    @Query() query: ListFoldersQueryDto,
  ) {
    return this.foldersService.listFolders(userId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new folder' })
  @SwaggerApiResponse({ status: 201, description: 'Folder created successfully' })
  async createFolder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFolderDto,
  ) {
    return this.foldersService.createFolder(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename or move a folder' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Folder updated successfully' })
  async updateFolder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) folderId: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.foldersService.updateFolder(userId, folderId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a folder' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Folder deleted successfully' })
  async deleteFolder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) folderId: string,
  ) {
    return this.foldersService.deleteFolder(userId, folderId);
  }
}
