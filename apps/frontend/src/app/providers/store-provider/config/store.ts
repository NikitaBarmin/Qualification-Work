import { configureStore } from '@reduxjs/toolkit';

import { baseApi } from '@/shared/api';

import { rootReducer } from './rootReducer';

export function createReduxStore() {
  return configureStore({
    reducer: rootReducer,
    devTools: import.meta.env.DEV,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export type AppStore = ReturnType<typeof createReduxStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
