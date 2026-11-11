import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from '@marshall/shared';
import type { AiChatDto } from './dtos/ai-chat.dto';
import type { AiSummarizeDto } from './dtos/ai-summarize.dto';

export interface ChatResponse {
  content: string;
  provider: AIProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface SummarizeResponse {
  summary: string;
  provider: AIProvider;
  model: string;
  tokensUsed: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  // ─────────────────────────── Public API ───────────────────────────

  async chat(dto: AiChatDto): Promise<ChatResponse> {
    const provider = dto.provider ?? AIProvider.OPENAI;

    switch (provider) {
      case AIProvider.GOOGLE:
        return this.chatWithGemini(dto);
      case AIProvider.ANTHROPIC:
        return this.chatWithAnthropic(dto);
      case AIProvider.OPENAI:
      default:
        return this.chatWithOpenAI(dto);
    }
  }

  async summarize(dto: AiSummarizeDto): Promise<SummarizeResponse> {
    const systemPrompt = dto.focus
      ? `You are an expert summariser. Summarise the provided text with a focus on: ${dto.focus}. Be concise, structured, and use bullet points for key information.`
      : 'You are an expert summariser. Provide a clear, concise summary of the provided text. Use bullet points for key information.';

    const chatResult = await this.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dto.text },
      ],
      provider: dto.provider,
      model: dto.model,
      maxTokens: 1024,
    });

    return {
      summary: chatResult.content,
      provider: chatResult.provider,
      model: chatResult.model,
      tokensUsed: chatResult.totalTokens,
    };
  }

  // ─────────────────────────── OpenAI ───────────────────────────

  private async chatWithOpenAI(dto: AiChatDto): Promise<ChatResponse> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('OpenAI API key is not configured');
    }

    const model = dto.model ?? 'gpt-4o-mini';
    const maxTokens = dto.maxTokens ?? 2048;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: dto.messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new BadRequestException(`OpenAI API error: ${err}`);
      }

      const data = (await response.json()) as any;
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content ?? '',
        provider: AIProvider.OPENAI,
        model,
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      };
    } catch (err: any) {
      this.logger.error(`OpenAI chat error: ${err.message}`);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`OpenAI request failed: ${err.message}`);
    }
  }

  // ─────────────────────────── Gemini ───────────────────────────

  private async chatWithGemini(dto: AiChatDto): Promise<ChatResponse> {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('Google AI API key is not configured');
    }

    const model = dto.model ?? 'gemini-2.0-flash';

    // Build Gemini-compatible contents array
    const contents = dto.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Prepend system message as a user turn if present
    const systemMsg = dto.messages.find((m) => m.role === 'system');
    if (systemMsg) {
      contents.unshift({ role: 'user', parts: [{ text: systemMsg.content }] });
      contents.splice(1, 0, { role: 'model', parts: [{ text: 'Understood.' }] });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: dto.maxTokens ?? 2048,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new BadRequestException(`Gemini API error: ${err}`);
      }

      const data = (await response.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const usage = data.usageMetadata || {};

      return {
        content: text,
        provider: AIProvider.GOOGLE,
        model,
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
      };
    } catch (err: any) {
      this.logger.error(`Gemini chat error: ${err.message}`);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Gemini request failed: ${err.message}`);
    }
  }

  // ─────────────────────────── Anthropic ───────────────────────────

  private async chatWithAnthropic(dto: AiChatDto): Promise<ChatResponse> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('Anthropic API key is not configured');
    }

    const model = dto.model ?? 'claude-sonnet-4-5';
    const systemMsg = dto.messages.find((m) => m.role === 'system');
    const userMessages = dto.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: dto.maxTokens ?? 2048,
          system: systemMsg?.content,
          messages: userMessages,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new BadRequestException(`Anthropic API error: ${err}`);
      }

      const data = (await response.json()) as any;
      const text = data.content?.[0]?.text ?? '';
      const usage = data.usage || {};

      return {
        content: text,
        provider: AIProvider.ANTHROPIC,
        model,
        promptTokens: usage.input_tokens ?? 0,
        completionTokens: usage.output_tokens ?? 0,
        totalTokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
      };
    } catch (err: any) {
      this.logger.error(`Anthropic chat error: ${err.message}`);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Anthropic request failed: ${err.message}`);
    }
  }
}
