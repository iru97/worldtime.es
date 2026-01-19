import { supabase } from '@/lib/supabase';
import type { ApiResponse, ApiError, PaginatedResponse } from '@/types';
import { logger } from '@/services/LoggingService';

/**
 * Base API Service with common patterns for all domain services
 */
export abstract class BaseApiService {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Wrap Supabase response in standard ApiResponse format
   */
  protected async handleResponse<T>(
    promise: PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await promise;

      if (error) {
        logger.error(`API Error [${this.tableName}]:`, { error });
        return {
          success: false,
          error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message,
          },
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (err) {
      const error = err as Error;
      logger.error(`API Exception [${this.tableName}]:`, { error: error.message });
      return {
        success: false,
        error: {
          code: 'EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * Get current authenticated user ID
   */
  protected async getUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  }

  /**
   * Require authenticated user, throw if not authenticated
   */
  protected async requireUserId(): Promise<string> {
    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('Authentication required');
    }
    return userId;
  }

  /**
   * Generic paginated query
   */
  protected async paginatedQuery<T>(
    query: ReturnType<typeof supabase.from>,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      // Get count first
      const { count, error: countError } = await query.select('*', { count: 'exact', head: true });

      if (countError) {
        return {
          success: false,
          error: {
            code: countError.code || 'COUNT_ERROR',
            message: countError.message,
          },
        };
      }

      // Get paginated data
      const { data, error } = await query.select('*').range(from, to);

      if (error) {
        return {
          success: false,
          error: {
            code: error.code || 'QUERY_ERROR',
            message: error.message,
          },
        };
      }

      return {
        success: true,
        data: {
          data: data as T[],
          total: count || 0,
          page,
          page_size: pageSize,
          has_more: (count || 0) > to + 1,
        },
      };
    } catch (err) {
      const error = err as Error;
      return {
        success: false,
        error: {
          code: 'EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * Generate a random slug
   */
  protected generateSlug(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a URL-friendly slug from text
   */
  protected slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

/**
 * Error codes for API operations
 */
export const ApiErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE: 'DUPLICATE',
  RATE_LIMITED: 'RATE_LIMITED',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  CALENDAR_SYNC_ERROR: 'CALENDAR_SYNC_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];
