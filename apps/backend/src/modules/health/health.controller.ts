import type { RequestHandler } from 'express';

import { getHealthStatus } from './health.service.js';

export const getHealthController: RequestHandler = (_request, response) => {
  response.status(200).json({
    data: getHealthStatus(),
  });
};
