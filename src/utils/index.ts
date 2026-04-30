export const CLICK_CODE_CACHE_PREFIX = 'click:';
export const STATS_CODE_CACHE_PREFIX = 'stats:';

export const generateCacheKey = (prefix: string, code: string): string => {
  return `${prefix}${code}`;
};
