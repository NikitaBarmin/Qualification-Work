import { z } from 'zod';

export const createAnalysisSchema = z.object({
  datasetVersionId: z.string().min(1),
});

export type CreateAnalysisDto = z.infer<typeof createAnalysisSchema>;
