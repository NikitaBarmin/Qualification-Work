import { Router, type Router as ExpressRouter } from 'express';
import multer from 'multer';

import { paths } from '../../config/paths.js';
import { requireSession } from '../../middleware/require-session.js';
import { createUploadPreviewController } from './upload.controller.js';

const upload = multer({
  dest: paths.tempUploadsRoot,
});

export const uploadRouter: ExpressRouter = Router();

uploadRouter.post('/preview', requireSession, upload.single('file'), createUploadPreviewController);
