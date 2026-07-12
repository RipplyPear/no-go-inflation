import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export function errorMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('Request error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: 'Internal server error',
  });
}
