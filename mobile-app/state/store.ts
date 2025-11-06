import { configureStore } from '@reduxjs/toolkit';
import ecgReducer from './slices/ecgSlice';
import connectionReducer from './slices/connectionSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    ecg: ecgReducer,
    connection: connectionReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['ecg/setBatch', 'ecg/setLiveData'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['ecg.currentBatch', 'ecg.liveData'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
