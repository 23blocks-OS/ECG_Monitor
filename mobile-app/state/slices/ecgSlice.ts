import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ECGBatch, ECGLiveData } from '@/types';

interface ECGState {
  currentBatch: ECGBatch | null;
  liveData: ECGLiveData | null;
  recentBatches: ECGBatch[];
  isReceivingData: boolean;
  lastUpdate: number | null;
}

const initialState: ECGState = {
  currentBatch: null,
  liveData: null,
  recentBatches: [],
  isReceivingData: false,
  lastUpdate: null,
};

const ecgSlice = createSlice({
  name: 'ecg',
  initialState,
  reducers: {
    setBatch: (state, action: PayloadAction<ECGBatch>) => {
      state.currentBatch = action.payload;
      state.lastUpdate = Date.now();

      // Add to recent batches (keep last 10)
      state.recentBatches = [action.payload, ...state.recentBatches].slice(0, 10);

      // Update live data from batch
      state.liveData = {
        device_id: action.payload.device_id,
        timestamp: action.payload.start_timestamp,
        status: 'active',
        metrics: {
          heart_rate_bpm: 72, // Would be calculated from ECG data
          hrv_rmssd: 42.5,
          signal_quality: action.payload.signal_quality,
        },
        waveform: action.payload.channels,
      };
    },

    setLiveData: (state, action: PayloadAction<ECGLiveData>) => {
      state.liveData = action.payload;
      state.lastUpdate = Date.now();
    },

    setReceivingData: (state, action: PayloadAction<boolean>) => {
      state.isReceivingData = action.payload;
    },

    clearECGData: (state) => {
      state.currentBatch = null;
      state.liveData = null;
      state.recentBatches = [];
      state.isReceivingData = false;
      state.lastUpdate = null;
    },

    addRecentBatch: (state, action: PayloadAction<ECGBatch>) => {
      state.recentBatches = [action.payload, ...state.recentBatches].slice(0, 10);
    },
  },
});

export const {
  setBatch,
  setLiveData,
  setReceivingData,
  clearECGData,
  addRecentBatch,
} = ecgSlice.actions;

export default ecgSlice.reducer;
