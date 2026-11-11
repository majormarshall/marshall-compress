import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiChatDto } from './dtos/ai-chat.dto';
import { AiSummarizeDto } from './dtos/ai-summarize.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a chat message to an AI provider' })
  @SwaggerApiResponse({ status: 200, description: 'AI chat response' })
  async chat(@Body() dto: AiChatDto) {
    return this.aiService.chat(dto);
  }

  @Post('summarize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Summarize text using an AI provider' })
  @SwaggerApiResponse({ status: 200, description: 'AI summarization result' })
  async summarize(@Body() dto: AiSummarizeDto) {
    return this.aiService.summarize(dto);
  }
}
