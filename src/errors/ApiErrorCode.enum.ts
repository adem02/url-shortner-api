export enum ApiErrorCode {
  InternalServerError = 500,

  BadRequest = 400,
  NotFound = 404,
  UnprocessableEntity = 422,
  TooManyRequests = 429,
}
