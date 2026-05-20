import { createSlice } from '@reduxjs/toolkit';

import type {
  ISessionSchema,
  ISessionUser,
} from '../types/session';

const initialState: ISessionSchema = {
  initialized: false,
  status: 'anonymous',
  user: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    markSessionInitialized(state) {
      state.initialized = true;
    },
    startGuestSession(state) {
      state.initialized = true;
      state.status = 'guest';
      state.user = null;
    },
    setAuthenticatedSession(
      state,
      action: { payload: ISessionUser },
    ) {
      state.initialized = true;
      state.status = 'authenticated';
      state.user = action.payload;
    },
    clearSession(state) {
      state.initialized = true;
      state.status = 'anonymous';
      state.user = null;
    },
  },
});

export const {
  clearSession,
  markSessionInitialized,
  setAuthenticatedSession,
  startGuestSession,
} = sessionSlice.actions;

export const sessionReducer = sessionSlice.reducer;
