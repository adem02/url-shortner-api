import { ApiConfig } from '@/config/api.config';
import Logger from '@/config/logger.config';
import { ApiError, ApiErrorCode } from '@/errors';

export class UrlValidator {
  private static readonly BLOCKED_DOMAINS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

  static validate(url: string): void {
    if (!url) {
      throw new ApiError(ApiErrorCode.BadRequest, 'validation/failed', 'URL cannot be empty');
    }

    if (url.length > 2048) {
      throw new ApiError(ApiErrorCode.BadRequest, 'validation/failed', 'URL too long (max 2048)');
    }

    if (!this.startsWithHttpProtocol(url)) {
      throw new ApiError(
        ApiErrorCode.BadRequest,
        'validation/failed',
        'URL must start with http:// or https://.',
      );
    }

    const validURL = this.getValidURL(url);

    if (!validURL) {
      throw new ApiError(ApiErrorCode.BadRequest, 'validation/failed', 'Invalid URL format');
    }

    if (!this.isAllowedHttpProtocol(validURL.protocol)) {
      throw new ApiError(
        ApiErrorCode.BadRequest,
        'validation/failed',
        'Only HTTP/HTTPS protocols are allowed',
      );
    }

    if (validURL.username || validURL.password) {
      throw new ApiError(
        ApiErrorCode.BadRequest,
        'validation/failed',
        'Credentials in URL are not allowed',
      );
    }

    if (this.isBlacklistedDomain(validURL.hostname)) {
      throw new ApiError(
        ApiErrorCode.BadRequest,
        'validation/failed',
        'This domain/IP is not allowed',
      );
    }
  }

  private static getValidURL(value: string): false | URL {
    try {
      const parsed = new URL(value);

      return parsed;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Invalid URL format';
      if (ApiConfig.isDevMode) {
        Logger.error(errMessage);
      }

      return false;
    }
  }

  private static startsWithHttpProtocol(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private static isAllowedHttpProtocol(protocol: string): boolean {
    return ['http:', 'https:'].includes(protocol);
  }

  private static isBlacklistedDomain(hostname: string): boolean {
    const h = hostname.toLowerCase();
    return (
      this.BLOCKED_DOMAINS.has(h) ||
      h.endsWith('.localhost') ||
      /^10\./.test(h) ||
      /^127\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^169\.254\./.test(h) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)
    );
  }
}
