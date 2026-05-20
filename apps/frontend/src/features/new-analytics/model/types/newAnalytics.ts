import type { DatasetMapping } from '@/entities/dataset/model/types/dataset';

export type NewAnalyticsStep =
  | 'upload'
  | 'mapping'
  | 'editing'
  | 'processing'
  | 'result';

export type DraftLaunchStatus =
  | 'idle'
  | 'ready'
  | 'processing'
  | 'completed'
  | 'failed';

export interface INewAnalyticsSchema {
  step: NewAnalyticsStep;
  businessType: string;
  businessDescription: string;
  selectedFileName: string | null;
  previewHeaders: string[];
  previewRows: string[][];
  mapping: DatasetMapping;
  hasTableChanges: boolean;
  partialAnalysisAllowed: boolean;
  launchStatus: DraftLaunchStatus;
}
