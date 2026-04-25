import { ApiErrorCode } from './ApiErrorCode.enum';
import { ApiErrorKey } from './ApiErrorKey.type';
import { ApiErrorInterface } from './ApiError.interface';

export class ApiError extends Error {
  constructor(
    readonly httpCode: ApiErrorCode,
    readonly errorKey: ApiErrorKey,
    errorMessage: string,
    private errorDetails?: any,
  ) {
    super(errorMessage);
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get json(): ApiErrorInterface {
    return {
      code: this.httpCode,
      key: this.errorKey,
      message: this.message,
      details: this.errorDetails,
    };
  }

  set details(value: any) {
    this.errorDetails = value;
  }

  get details(): any {
    return this.errorDetails;
  }
}
