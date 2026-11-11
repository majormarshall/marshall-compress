import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiErrorResponse } from '@marshall/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
        code = exception.name || `HTTP_${status}`;
      } else if (typeof response === 'object' && response !== null) {
        const resp = response as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        code = (resp.error as string) || exception.name || `HTTP_${status}`;
        details = resp.details ?? (Array.isArray(resp.message) ? resp.message : undefined);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      message = exception.message;
      code = exception.name || 'INTERNAL_SERVER_ERROR';
    }

    const path = request.url || request.raw?.url || '';

    const errorPayload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message: Array.isArray(message) ? message.join('; ') : message,
        details,
      },
      timestamp: new Date().toISOString(),
      path,
    };

    reply.status(status).send(errorPayload);
  }
}
