import { Router, type Router as ExpressRouter } from 'express';

import { getHealthController } from './health.controller.js';

export const healthRouter: ExpressRouter = Router();

healthRouter.get('/', getHealthController);
