import { z } from 'zod';

export type ApplicationErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_STATE'
  | 'INTERNAL';

export type SafeApplicationError = {
  code: ApplicationErrorCode;
  message: string;
  issues?: Array<{ path: string; message: string }>;
};

export class ApplicationError extends Error {
  constructor(
    public readonly code: Exclude<ApplicationErrorCode, 'INTERNAL'>,
    message: string
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  public readonly issues: Array<{ path: string; message: string }>;

  constructor(issues: Array<{ path: string; message: string }>) {
    super('VALIDATION', 'Please check the information and try again.');
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = 'The requested item could not be found.') {
    super('NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApplicationError {
  constructor(message = 'This item has changed. Refresh and try again.') {
    super('CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class InvalidStateError extends ApplicationError {
  constructor(message = 'This action is not available in the current state.') {
    super('INVALID_STATE', message);
    this.name = 'InvalidStateError';
  }
}

/** Convert Zod failures into short, user-safe paths and messages. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown
): z.output<S> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        message: issue.message
      }))
    );
  }

  return result.data;
}

/** Do not leak SQL, stack traces, storage details or arbitrary exception text. */
export function toSafeApplicationError(error: unknown): SafeApplicationError {
  if (error instanceof ValidationError) {
    return {
      code: error.code,
      message: error.message,
      issues: error.issues
    };
  }

  if (error instanceof ApplicationError) {
    return { code: error.code, message: error.message };
  }

  return {
    code: 'INTERNAL',
    message: 'Something went wrong. Please try again.'
  };
}
