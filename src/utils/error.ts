import { isErrorWithMessage } from './types';

export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return 'An unexpected error occurred';
}