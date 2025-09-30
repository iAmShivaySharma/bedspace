import { configureStore } from '@reduxjs/toolkit';
import { bedspaceApi } from './api/bedspaceApi';
import { authSlice } from './slices/authSlice';

// Import all API slices to ensure they're injected
import './api/authApi';
import './api/adminApi';
import './api/seekerApi';
import './api/providerApi';
import './api/commonApi';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [bedspaceApi.reducerPath]: bedspaceApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: [
          'meta.arg',
          'payload.timestamp',
          'meta.baseQueryMeta.request',
          'meta.baseQueryMeta.response',
        ],
      },
    }).concat(bedspaceApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
