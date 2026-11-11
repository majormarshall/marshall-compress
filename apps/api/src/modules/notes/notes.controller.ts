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
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dtos/create-note.dto';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { ListNotesQueryDto } from './dtos/list-notes-query.dto';
import { CreateNoteFolderDto } from './dtos/create-note-folder.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notes')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'List notes with search and filters' })
  @SwaggerApiResponse({ status: 200, description: 'Paginated list of notes' })
  async listNotes(
    @CurrentUser('id') userId: string,
    @Query() query: ListNotesQueryDto,
  ) {
    return this.notesService.listNotes(userId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new note' })
  @SwaggerApiResponse({ status: 201, description: 'Note created successfully' })
  async createNote(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.createNote(userId, dto);
  }

  // NOTE FOLDERS ENDPOINTS (Must be defined before :id route for Fastify path resolution)
  @Get('folders')
  @ApiOperation({ summary: 'List note folders' })
  @SwaggerApiResponse({ status: 200, description: 'List of note folders' })
  async listFolders(@CurrentUser('id') userId: string) {
    return this.notesService.listFolders(userId);
  }

  @Post('folders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a note folder' })
  @SwaggerApiResponse({ status: 201, description: 'Note folder created' })
  async createFolder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateNoteFolderDto,
  ) {
    return this.notesService.createFolder(userId, dto);
  }

  @Delete('folders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a note folder' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Note folder deleted' })
  async deleteFolder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) folderId: string,
  ) {
    return this.notesService.deleteFolder(userId, folderId);
  }

  // INDIVIDUAL NOTE ENDPOINTS
  @Get(':id')
  @ApiOperation({ summary: 'Get a single note by ID' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Note details' })
  async getNote(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) noteId: string,
  ) {
    return this.notesService.getNote(userId, noteId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Note updated successfully' })
  async updateNote(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(userId, noteId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Note soft-deleted' })
  async deleteNote(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) noteId: string,
  ) {
    return this.notesService.deleteNote(userId, noteId);
  }
}
