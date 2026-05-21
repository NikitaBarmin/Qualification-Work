import type { RequestHandler } from 'express';

import { AppError } from '../lib/app-error.js';

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new AppError('Route not found', 404));
};
