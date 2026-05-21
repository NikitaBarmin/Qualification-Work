import type { ErrorRequestHandler } from 'express';

import { AppError } from '../lib/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  response.status(500).json({
    message: 'Internal server error',
  });
};
