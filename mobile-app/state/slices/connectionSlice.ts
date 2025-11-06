import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BLEConnectionStatus, CloudConnectionStatus, ConnectionState } from '@/types';

interface ConnectionState {
  ble: BLEConnectionStatus;
  cloud: CloudConnectionStatus;
}

const initialState: ConnectionState = {
  ble: {
    state: 'disconnected',
    deviceId: undefined,
    deviceName: undefined,
    rssi: undefined,
    lastConnected: undefined,
  },
  cloud: {
    state: 'disconnected',
    lastSync: undefined,
    queuedBatches: 0,
  },
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setBLEConnectionState: (state, action: PayloadAction<ConnectionState['state']>) => {
      state.ble.state = action.payload;
      if (action.payload === 'connected') {
        state.ble.lastConnected = Date.now();
      }
    },

    setBLEDevice: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.ble.deviceId = action.payload.id;
      state.ble.deviceName = action.payload.name;
    },

    setBLERSSI: (state, action: PayloadAction<number>) => {
      state.ble.rssi = action.payload;
    },

    setBLEConnection: (state, action: PayloadAction<BLEConnectionStatus>) => {
      state.ble = action.payload;
    },

    setCloudConnectionState: (state, action: PayloadAction<ConnectionState['state']>) => {
      state.cloud.state = action.payload;
      if (action.payload === 'connected') {
        state.cloud.lastSync = Date.now();
      }
    },

    setCloudLastSync: (state, action: PayloadAction<number>) => {
      state.cloud.lastSync = action.payload;
    },

    setCloudQueuedBatches: (state, action: PayloadAction<number>) => {
      state.cloud.queuedBatches = action.payload;
    },

    setCloudConnection: (state, action: PayloadAction<CloudConnectionStatus>) => {
      state.cloud = action.payload;
    },

    resetConnections: (state) => {
      state.ble = initialState.ble;
      state.cloud = initialState.cloud;
    },
  },
});

export const {
  setBLEConnectionState,
  setBLEDevice,
  setBLERSSI,
  setBLEConnection,
  setCloudConnectionState,
  setCloudLastSync,
  setCloudQueuedBatches,
  setCloudConnection,
  resetConnections,
} = connectionSlice.actions;

export default connectionSlice.reducer;
