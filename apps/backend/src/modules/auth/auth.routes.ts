import { Router, type Router as ExpressRouter } from 'express';

import {
  getCurrentSessionController,
  loginController,
  logoutController,
  registerController,
} from './auth.controller.js';

export const authRouter: ExpressRouter = Router();

authRouter.get('/me', getCurrentSessionController);
authRouter.post('/login', loginController);
authRouter.post('/logout', logoutController);
authRouter.post('/register', registerController);
