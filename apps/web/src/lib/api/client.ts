import { createClient } from '../supabase/client';
import type { ApiResponse } from '@marshall/shared';

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, params, headers = {}, ...customConfig } = options;

    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const token = await this.getAuthToken();
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    };

    const config: RequestInit = {
      ...customConfig,
      headers: reqHeaders,
    };

    if (body !== undefined) {
      if (body instanceof FormData) {
        delete reqHeaders['Content-Type'];
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, config);
      const isJson = response.headers.get('content-type')?.includes('application/json');

      if (!response.ok) {
        let errorData: Record<string, any> = {};
        if (isJson) {
          try {
            const json = await response.json();
            errorData = json.error || { message: json.message || response.statusText };
          } catch {
            // fallback
          }
        }
        throw new ApiError(
          errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData.code || 'API_REQUEST_FAILED',
          errorData.details
        );
      }

      if (!isJson) {
        return (await response.text()) as unknown as T;
      }

      const jsonResult = (await response.json()) as any;
      
      // If envelope contains success: false
      if (jsonResult && typeof jsonResult === 'object' && 'success' in jsonResult) {
        if (!jsonResult.success) {
          throw new ApiError(
            jsonResult.error?.message || jsonResult.message || 'API response indicated failure',
            response.status,
            jsonResult.error?.code || 'API_BUSINESS_ERROR',
            jsonResult.error?.details
          );
        }
        return jsonResult.data;
      }

      return jsonResult as unknown as T;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        err instanceof Error ? err.message : 'Network error occurred',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
