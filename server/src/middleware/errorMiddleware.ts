import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Only log unexpected server errors or 500 errors to console to prevent cluttering terminal logs with expected 404/400 client queries
  if (!(err instanceof AppError && err.statusCode < 500) && !(err instanceof ZodError)) {
    console.error('[ErrorHandler] Caught Error:', err?.message || err);
  }

  // Multer Error Handling
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File size exceeds maximum limit of 25 MB.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
    return;
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      error: err.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  // Custom App Error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Standard JavaScript Error or API Error
  const statusCode = err.statusCode || 500;
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
  });
};
