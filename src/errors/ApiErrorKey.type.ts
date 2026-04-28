export type ApiErrorKey =
  // SQL
  | 'sql/failed'
  | 'sql/not-found'

  // Default
  | 'internal/unknown'

  // Validation
  | 'validation/failed'

  // Security
  | 'security/rate-limit-exceeded'

  // Resource
  | 'resource/not-found'

  // Servie
  | 'link/code-generation-failed';
