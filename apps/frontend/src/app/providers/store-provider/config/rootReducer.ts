import { combineReducers } from '@reduxjs/toolkit';

import { newAnalyticsReducer } from '@/features/new-analytics/model/slice/newAnalyticsSlice';

import { sessionReducer } from '@/entities/session/model/slice/sessionSlice';
import { baseApi } from '@/shared/api/baseApi';

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  session: sessionReducer,
  newAnalytics: newAnalyticsReducer,
});
