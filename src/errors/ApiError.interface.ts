import { ApiErrorCode } from './ApiErrorCode.enum';
import { ApiErrorKey } from './ApiErrorKey.type';

export interface ApiErrorInterface {
  code: ApiErrorCode;
  key: ApiErrorKey;
  message?: string;
  details?: any;
}
