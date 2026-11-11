/**
 * Structured API Error detail for client consumption.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown> | Array<Record<string, unknown>>;
  statusCode: number;
  timestamp: string;
}

/**
 * Standard metadata object attached to API responses.
 */
export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  executionTimeMs?: number;
  [key: string]: unknown;
}

/**
 * Canonical wrapper for all REST API endpoints.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * Pagination metadata included with collection responses.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated API envelope.
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta & ResponseMeta;
  message?: string;
  error?: ApiError;
}

/**
 * Query parameters for page-based data fetching.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

/**
 * Ordering instructions for sorted listings.
 */
export interface SortParams {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Generic search and filtering query parameters.
 */
export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  [key: string]: unknown;
}
