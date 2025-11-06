import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserSettings } from '@/types';

interface SettingsState extends UserSettings {
  isLoading: boolean;
}

const initialState: SettingsState = {
  bleDeviceId: undefined,
  bleDeviceName: undefined,
  awsRegion: 'us-east-1',
  autoUpload: true,
  useWifiOnly: false,
  dataRetentionDays: 7,
  notificationsEnabled: true,
  refreshIntervalMs: 5000,
  isLoading: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Partial<UserSettings>>) => {
      return { ...state, ...action.payload };
    },

    setBLEDeviceSettings: (
      state,
      action: PayloadAction<{ deviceId?: string; deviceName?: string }>
    ) => {
      state.bleDeviceId = action.payload.deviceId;
      state.bleDeviceName = action.payload.deviceName;
    },

    setAWSRegion: (state, action: PayloadAction<string>) => {
      state.awsRegion = action.payload;
    },

    setAutoUpload: (state, action: PayloadAction<boolean>) => {
      state.autoUpload = action.payload;
    },

    setUseWifiOnly: (state, action: PayloadAction<boolean>) => {
      state.useWifiOnly = action.payload;
    },

    setDataRetentionDays: (state, action: PayloadAction<number>) => {
      state.dataRetentionDays = action.payload;
    },

    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },

    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshIntervalMs = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    resetSettings: (state) => {
      return initialState;
    },
  },
});

export const {
  setSettings,
  setBLEDeviceSettings,
  setAWSRegion,
  setAutoUpload,
  setUseWifiOnly,
  setDataRetentionDays,
  setNotificationsEnabled,
  setRefreshInterval,
  setLoading,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
