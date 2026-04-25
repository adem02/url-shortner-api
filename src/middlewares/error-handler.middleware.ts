import Logger from '@/config/logger.config';
import { ApiError, ApiErrorCode } from '@/errors';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

export const ErrorHandlerMiddleware: ErrorRequestHandler = (
  error: any,
  _: Request,
  res: Response,
  __: NextFunction,
): void => {
  let err = new ApiError(
    ApiErrorCode.InternalServerError,
    'internal/unknown',
    'An unknown error occurred',
  );
  let logString = '';

  if (error) {
    if (error instanceof ApiError) {
      err = error;
      logString = error.message;

      if (err.details && err.details.name === 'ZodError') {
        err.details = Object.values(err.details.issues).map((issue) => {
          const { path, message } = issue as { path: string[]; message: string };

          return {
            property: path?.[0] || 'unknownProperty',
            message: message,
          };
        });
      }
    } else if (error.sql) {
      const errMessage = (error.message as string) || 'unknown sql error';
      err = new ApiError(ApiErrorCode.BadRequest, 'sql/failed', errMessage, {
        sqlState: error.sqlState,
        sqlCode: error.code,
      });
    } else {
      if (error.message) {
        err.message = error.message;
        logString = `${err.message}\nStack: ${error.stack || 'No stack available'}`;
      }
    }
  }

  Logger.error(logString);
  res.status(err.httpCode).json(err.json);
};
