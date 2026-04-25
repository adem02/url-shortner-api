export type ApiErrorKey =
  // SQL
  | 'sql/failed'
  | 'sql/not-found'

  // Default
  | 'internal/unknown'

  // Validation
  | 'validation/failed';
