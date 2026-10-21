import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/response.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response | void {
  console.error('[Error Handler]:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const field = issue.path.join('.');
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(issue.message);
    }
    return errorResponse(res, 'The given data was invalid.', 422, formattedErrors);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || {});
    const field = keys[0] || 'field';
    return errorResponse(res, `A record with that ${field} already exists.`, 422, {
      [field]: [`The ${field} has already been taken.`],
    });
  }

  const message = err.message || 'Internal server error';
  const status = err.status || err.statusCode || 500;
  return errorResponse(res, message, status);
}
