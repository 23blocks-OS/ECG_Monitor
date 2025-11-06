"""
ECG Signal Processing

Apply filters and processing to raw ECG data:
- Notch filter (50/60 Hz power line noise)
- Bandpass filter (0.5-40 Hz for ECG)
- Baseline correction
"""

import numpy as np
from scipy import signal


class ECGSignalProcessor:
    """Process raw ECG signals"""

    def __init__(self, sampling_rate=250, notch_freq=60,
                 bandpass_low=0.5, bandpass_high=40):
        """
        Initialize signal processor

        Args:
            sampling_rate: Sampling rate in Hz
            notch_freq: Notch filter frequency (50 or 60 Hz)
            bandpass_low: Bandpass lower cutoff (Hz)
            bandpass_high: Bandpass upper cutoff (Hz)
        """
        self.sampling_rate = sampling_rate
        self.notch_freq = notch_freq
        self.bandpass_low = bandpass_low
        self.bandpass_high = bandpass_high

        # Design filters
        self._design_filters()

    def _design_filters(self):
        """Design digital filters"""
        nyquist = self.sampling_rate / 2

        # Notch filter (IIR)
        Q = 30.0  # Quality factor
        w0 = self.notch_freq / nyquist
        self.notch_b, self.notch_a = signal.iirnotch(w0, Q)

        # Bandpass filter (Butterworth)
        order = 4
        low = self.bandpass_low / nyquist
        high = self.bandpass_high / nyquist
        self.bandpass_b, self.bandpass_a = signal.butter(
            order, [low, high], btype='band'
        )

    def process_channel(self, data):
        """
        Process one channel of ECG data

        Args:
            data: NumPy array of raw samples

        Returns:
            NumPy array of processed samples
        """
        if len(data) < 10:
            return data  # Not enough data to filter

        # Apply notch filter
        filtered = signal.filtfilt(self.notch_b, self.notch_a, data)

        # Apply bandpass filter
        filtered = signal.filtfilt(self.bandpass_b, self.bandpass_a, filtered)

        # Baseline correction (remove DC offset)
        filtered = filtered - np.mean(filtered)

        return filtered

    def process_batch(self, batch_data):
        """
        Process a batch with 3 channels

        Args:
            batch_data: Dict with 'channel_1', 'channel_2', 'channel_3' arrays

        Returns:
            Dict with processed channels
        """
        processed = {}

        for channel_name in ['channel_1', 'channel_2', 'channel_3']:
            if channel_name in batch_data:
                raw_data = np.array(batch_data[channel_name])
                processed[channel_name] = self.process_channel(raw_data).tolist()
            else:
                processed[channel_name] = []

        return processed

    def calculate_signal_quality(self, data):
        """
        Estimate signal quality (0.0 to 1.0)

        Based on:
        - SNR (signal-to-noise ratio)
        - Baseline wander
        - Saturation detection
        """
        if len(data) < 10:
            return 0.0

        data_array = np.array(data)

        # Check for saturation (clipping)
        max_val = np.max(np.abs(data_array))
        saturation_threshold = 0.95 * (2**23)  # 24-bit ADC
        if max_val > saturation_threshold:
            return 0.3  # Poor quality if saturated

        # Estimate SNR (simplified)
        signal_power = np.var(data_array)

        # High-pass filter to estimate noise
        sos = signal.butter(4, 40 / (self.sampling_rate / 2), 'hp', output='sos')
        noise = signal.sosfilt(sos, data_array)
        noise_power = np.var(noise)

        if noise_power < 1e-10:
            snr = 100.0
        else:
            snr = 10 * np.log10(signal_power / noise_power)

        # Map SNR to quality score (0 to 1)
        # Good SNR: >20 dB, Poor SNR: <10 dB
        if snr > 20:
            quality = 1.0
        elif snr < 5:
            quality = 0.2
        else:
            quality = 0.2 + (snr - 5) / 15 * 0.8

        return round(quality, 2)


# Simple processor without scipy (for lightweight deployment)
class SimpleECGProcessor:
    """Simplified ECG processor without heavy dependencies"""

    def __init__(self, sampling_rate=250):
        self.sampling_rate = sampling_rate

    def process_channel(self, data):
        """Apply simple moving average filter"""
        if len(data) < 5:
            return data

        # Simple moving average (3-point)
        processed = []
        for i in range(len(data)):
            if i == 0:
                processed.append(data[i])
            elif i == len(data) - 1:
                processed.append(data[i])
            else:
                avg = (data[i-1] + data[i] + data[i+1]) / 3
                processed.append(int(avg))

        # Remove DC offset
        mean_val = sum(processed) / len(processed)
        processed = [x - mean_val for x in processed]

        return processed

    def process_batch(self, batch_data):
        """Process batch with simple filter"""
        processed = {}

        for channel_name in ['channel_1', 'channel_2', 'channel_3']:
            if channel_name in batch_data:
                processed[channel_name] = self.process_channel(batch_data[channel_name])
            else:
                processed[channel_name] = []

        return processed

    def calculate_signal_quality(self, data):
        """Simple quality estimate based on variance"""
        if len(data) < 10:
            return 0.0

        # Calculate variance
        mean_val = sum(data) / len(data)
        variance = sum((x - mean_val)**2 for x in data) / len(data)

        # Map variance to quality (heuristic)
        if variance > 1e10:
            return 0.9
        elif variance < 1e8:
            return 0.3
        else:
            return 0.6

        return 0.75
