import { createSlice } from '@reduxjs/toolkit';

import type { DatasetMapping } from '@/entities/dataset/model/types/dataset';

import type {
  DraftLaunchStatus,
  INewAnalyticsSchema,
  NewAnalyticsStep,
} from '../types/newAnalytics';

const initialMapping: DatasetMapping = {
  Date: null,
  Channel: null,
  Spend: null,
  Traffic_Leads: null,
  New_Orders: null,
  Returning_Orders: null,
  Revenue: null,
};

const initialState: INewAnalyticsSchema = {
  step: 'upload',
  businessType: '',
  businessDescription: '',
  selectedFileName: null,
  previewHeaders: [],
  previewRows: [],
  mapping: initialMapping,
  hasTableChanges: false,
  partialAnalysisAllowed: true,
  launchStatus: 'idle',
};

const newAnalyticsSlice = createSlice({
  name: 'newAnalytics',
  initialState,
  reducers: {
    resetNewAnalyticsDraft: () => initialState,
    setNewAnalyticsStep(
      state,
      action: { payload: NewAnalyticsStep },
    ) {
      state.step = action.payload;
    },
    setBusinessContext(
      state,
      action: {
        payload: {
          businessType: string;
          businessDescription: string;
        };
      },
    ) {
      state.businessType = action.payload.businessType;
      state.businessDescription = action.payload.businessDescription;
    },
    setSelectedFileName(
      state,
      action: { payload: string | null },
    ) {
      state.selectedFileName = action.payload;
    },
    setPreviewData(
      state,
      action: {
        payload: { headers: string[]; rows: string[][] };
      },
    ) {
      state.previewHeaders = action.payload.headers;
      state.previewRows = action.payload.rows;
    },
    updateColumnMapping(
      state,
      action: {
        payload: {
          field: keyof DatasetMapping;
          column: string | null;
        };
      },
    ) {
      state.mapping[action.payload.field] = action.payload.column;
    },
    markTableChanged(
      state,
      action: { payload: boolean },
    ) {
      state.hasTableChanges = action.payload;
    },
    setPartialAnalysisAllowed(
      state,
      action: { payload: boolean },
    ) {
      state.partialAnalysisAllowed = action.payload;
    },
    setLaunchStatus(
      state,
      action: { payload: DraftLaunchStatus },
    ) {
      state.launchStatus = action.payload;
    },
    hydrateDemoDraft(state) {
      state.step = 'mapping';
      state.businessType = 'ecommerce';
      state.businessDescription =
        'Небольшой интернет-магазин с рекламой в VK и YouTube.';
      state.selectedFileName = 'march-marketing-report.xlsx';
      state.previewHeaders = [
        'Дата',
        'Канал',
        'Расход',
        'Переходы',
        'Новые заказы',
        'Повторные заказы',
        'Выручка',
      ];
      state.previewRows = [
        ['2026-03-01', 'VK', '15400', '420', '18', '7', '96800'],
        ['2026-03-02', 'YouTube', '9200', '315', '11', '5', '64800'],
      ];
      state.mapping = {
        Date: 'Дата',
        Channel: 'Канал',
        Spend: 'Расход',
        Traffic_Leads: 'Переходы',
        New_Orders: 'Новые заказы',
        Returning_Orders: 'Повторные заказы',
        Revenue: 'Выручка',
      };
      state.launchStatus = 'ready';
    },
  },
});

export const {
  hydrateDemoDraft,
  markTableChanged,
  resetNewAnalyticsDraft,
  setBusinessContext,
  setLaunchStatus,
  setNewAnalyticsStep,
  setPartialAnalysisAllowed,
  setPreviewData,
  setSelectedFileName,
  updateColumnMapping,
} = newAnalyticsSlice.actions;

export const newAnalyticsReducer = newAnalyticsSlice.reducer;
