import { combineReducers } from '@reduxjs/toolkit';

import { sessionReducer } from '@/entities/session';
import { newAnalyticsReducer } from '@/features/new-analytics';
import { baseApi } from '@/shared/api';

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  session: sessionReducer,
  newAnalytics: newAnalyticsReducer,
});
