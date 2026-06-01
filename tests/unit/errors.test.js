import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} from '../../src/utils/errors.js';

describe('AppError hierarchy', () => {
  test('ValidationError uses 400 status code', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error).toBeInstanceOf(AppError);
  });

  test('UnauthorizedError uses 401 status code', () => {
    const error = new UnauthorizedError('Invalid token');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  test('ForbiddenError uses 403 status code', () => {
    const error = new ForbiddenError('Admin only');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  test('NotFoundError uses 404 status code', () => {
    const error = new NotFoundError('Task not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  test('ConflictError uses 409 status code', () => {
    const error = new ConflictError('Email exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });
});
