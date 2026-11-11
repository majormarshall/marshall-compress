import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '@marshall/shared';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        // If result is already structured with success flag
        if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
          return result;
        }

        // If result contains paginated list items and meta
        if (result && typeof result === 'object' && 'items' in result && 'total' in result) {
          const { items, ...meta } = result;
          return {
            success: true,
            data: items,
            meta,
            timestamp: new Date().toISOString(),
          };
        }

        if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
          return {
            success: true,
            data: result.data,
            meta: result.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data: result ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
