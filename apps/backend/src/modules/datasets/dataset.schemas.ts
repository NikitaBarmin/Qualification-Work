import { z } from 'zod';

const mappingRuleSchema = z.object({
  source: z.string().min(1),
  required: z.boolean(),
  type: z.enum(['date', 'string', 'number', 'money', 'unknown']),
});

const editPatchSchema = z.object({
  updatedRows: z.array(
    z.object({
      rowIndex: z.number().int().nonnegative(),
      values: z.record(z.string(), z.unknown()),
    }),
  ),
  addedRows: z.array(z.record(z.string(), z.unknown())),
  deletedRows: z.array(z.number().int().nonnegative()),
});

export const createDatasetSchema = z.object({
  uploadId: z.string().min(1),
  name: z.string().min(1).max(120),
  mapping: z.partialRecord(
    z.enum([
      'date',
      'channel',
      'spend',
      'traffic_leads',
      'new_orders',
      'returning_orders',
      'revenue',
    ]),
    mappingRuleSchema,
  ),
});

export const createDatasetVersionSchema = z.object({
  uploadId: z.string().min(1),
  mapping: createDatasetSchema.shape.mapping,
});

export const updateDatasetDraftSchema = z.object({
  mapping: createDatasetSchema.shape.mapping,
  editPatch: editPatchSchema.nullable(),
});

export type CreateDatasetDto = z.infer<typeof createDatasetSchema>;
export type CreateDatasetVersionDto = z.infer<typeof createDatasetVersionSchema>;
export type UpdateDatasetDraftDto = z.infer<typeof updateDatasetDraftSchema>;
