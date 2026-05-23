import type { RequestHandler } from 'express';

import { getAuthenticatedUser } from '../../middleware/require-session.js';
import { createUploadPreview } from './upload.service.js';

export const createUploadPreviewController: RequestHandler = async (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);
    const data = await createUploadPreview({
      userId: user.id,
      file: request.file,
    });

    response.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};
