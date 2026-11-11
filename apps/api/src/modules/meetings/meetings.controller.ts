import {
  Controller,
  Get,
  Post,
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
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dtos/create-meeting.dto';
import { ListMeetingsQueryDto } from './dtos/list-meetings-query.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Meetings')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @ApiOperation({ summary: 'List meetings with pagination and filters' })
  @SwaggerApiResponse({ status: 200, description: 'Paginated list of meetings' })
  async listMeetings(
    @CurrentUser('id') userId: string,
    @Query() query: ListMeetingsQueryDto,
  ) {
    return this.meetingsService.findAll(userId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new meeting record' })
  @SwaggerApiResponse({ status: 201, description: 'Meeting created successfully' })
  async createMeeting(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingsService.create(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a meeting by ID' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Meeting details' })
  async getMeeting(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) meetingId: string,
  ) {
    return this.meetingsService.findOne(userId, meetingId);
  }

  @Get(':id/transcript')
  @ApiOperation({ summary: 'Get meeting transcript' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Meeting transcript text and segments' })
  async getTranscript(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) meetingId: string,
  ) {
    return this.meetingsService.getTranscript(userId, meetingId);
  }

  @Get(':id/action-items')
  @ApiOperation({ summary: 'Get action items extracted from a meeting' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @SwaggerApiResponse({ status: 200, description: 'List of action items' })
  async getActionItems(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) meetingId: string,
  ) {
    return this.meetingsService.getActionItems(userId, meetingId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a meeting' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Meeting deleted' })
  async deleteMeeting(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) meetingId: string,
  ) {
    return this.meetingsService.delete(userId, meetingId);
  }
}
