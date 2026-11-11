import { HttpException, HttpStatus } from '@nestjs/common';

export interface AppErrorDetails {
  [key: string]: unknown;
}

/**
 * Base custom application exception
 */
export class AppException extends HttpException {
  public readonly code: string;
  public readonly details?: AppErrorDetails;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    code = 'INTERNAL_ERROR',
    details?: AppErrorDetails,
  ) {
    super(
      {
        message,
        statusCode,
        code,
        details,
      },
      statusCode,
    );
    this.code = code;
    this.details = details;
  }
}

export class BadRequestException extends AppException {
  constructor(message = 'Bad Request', details?: AppErrorDetails) {
    super(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message = 'Unauthorized', details?: AppErrorDetails) {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenException extends AppException {
  constructor(message = 'Forbidden resource', details?: AppErrorDetails) {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN', details);
  }
}

export class NotFoundException extends AppException {
  constructor(message = 'Resource not found', details?: AppErrorDetails) {
    super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND', details);
  }
}

export class ConflictException extends AppException {
  constructor(message = 'Resource already exists', details?: AppErrorDetails) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT', details);
  }
}

export class PayloadTooLargeException extends AppException {
  constructor(message = 'Payload too large', details?: AppErrorDetails) {
    super(message, HttpStatus.PAYLOAD_TOO_LARGE, 'PAYLOAD_TOO_LARGE', details);
  }
}
