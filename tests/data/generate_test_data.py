"""
ECG Test Data Generator

Generates realistic ECG waveform data for testing
"""

import json
import math
import random
import time
from pathlib import Path


class ECGDataGenerator:
    """Generate realistic ECG waveforms for testing"""

    def __init__(self, sampling_rate=250):
        self.sampling_rate = sampling_rate
        self.time = 0

    def generate_normal_sinus_rhythm(self, duration_seconds=10, heart_rate=72):
        """
        Generate normal sinus rhythm ECG

        Args:
            duration_seconds: Duration in seconds
            heart_rate: Heart rate in BPM

        Returns:
            Dict with 3-channel ECG data
        """
        num_samples = int(duration_seconds * self.sampling_rate)
        beat_interval = 60.0 / heart_rate  # seconds between beats

        channel_1 = []
        channel_2 = []
        channel_3 = []

        for i in range(num_samples):
            t = i / self.sampling_rate

            # Position in cardiac cycle
            cycle_pos = (t % beat_interval) / beat_interval

            # Generate QRS complex and other waves
            ecg_val = self._generate_ecg_point(cycle_pos)

            # Add some noise
            noise = random.gauss(0, 0.02)

            # Scale for different leads
            channel_1.append(int(ecg_val * 100000 + noise * 10000))
            channel_2.append(int(ecg_val * 90000 + noise * 10000))
            channel_3.append(int(ecg_val * 95000 + noise * 10000))

        return {
            'channel_1': channel_1,
            'channel_2': channel_2,
            'channel_3': channel_3
        }

    def generate_with_arrhythmia(self, duration_seconds=10, arrhythmia_type='pvc'):
        """
        Generate ECG with arrhythmias

        Args:
            duration_seconds: Duration in seconds
            arrhythmia_type: Type of arrhythmia ('pvc', 'afib', 'tachycardia')

        Returns:
            Dict with 3-channel ECG data
        """
        if arrhythmia_type == 'pvc':
            return self._generate_with_pvc(duration_seconds)
        elif arrhythmia_type == 'afib':
            return self._generate_with_afib(duration_seconds)
        elif arrhythmia_type == 'tachycardia':
            return self.generate_normal_sinus_rhythm(duration_seconds, heart_rate=150)
        else:
            return self.generate_normal_sinus_rhythm(duration_seconds)

    def _generate_ecg_point(self, cycle_pos):
        """
        Generate single ECG point in cardiac cycle

        Args:
            cycle_pos: Position in cycle (0.0 to 1.0)

        Returns:
            ECG amplitude value
        """
        # P wave (atrial depolarization)
        if 0.0 <= cycle_pos < 0.1:
            p_wave = 0.2 * math.sin(cycle_pos * 10 * math.pi)
        else:
            p_wave = 0

        # QRS complex (ventricular depolarization)
        if 0.15 <= cycle_pos < 0.25:
            # Q wave (small negative)
            if 0.15 <= cycle_pos < 0.17:
                qrs = -0.3 * ((cycle_pos - 0.15) / 0.02)
            # R wave (large positive)
            elif 0.17 <= cycle_pos < 0.21:
                qrs = 1.0 * math.sin((cycle_pos - 0.17) / 0.04 * math.pi)
            # S wave (small negative)
            else:
                qrs = -0.4 * math.sin((cycle_pos - 0.21) / 0.04 * math.pi)
        else:
            qrs = 0

        # T wave (ventricular repolarization)
        if 0.35 <= cycle_pos < 0.60:
            t_wave = 0.3 * math.sin((cycle_pos - 0.35) / 0.25 * math.pi)
        else:
            t_wave = 0

        # Baseline
        baseline = 0.0

        return baseline + p_wave + qrs + t_wave

    def _generate_with_pvc(self, duration_seconds):
        """Generate ECG with premature ventricular contractions"""
        num_samples = int(duration_seconds * self.sampling_rate)
        beat_interval = 60.0 / 72  # Normal HR

        channel_1 = []
        channel_2 = []
        channel_3 = []

        # Insert PVCs at random intervals
        pvc_positions = [int(random.uniform(0.3, 0.9) * num_samples)]

        for i in range(num_samples):
            t = i / self.sampling_rate

            # Check if this is a PVC
            is_pvc = any(abs(i - pos) < 50 for pos in pvc_positions)

            if is_pvc:
                # Wide, bizarre QRS complex
                cycle_pos = ((i % 100) / 100.0)
                ecg_val = 1.5 * math.sin(cycle_pos * math.pi)
            else:
                cycle_pos = (t % beat_interval) / beat_interval
                ecg_val = self._generate_ecg_point(cycle_pos)

            noise = random.gauss(0, 0.02)

            channel_1.append(int(ecg_val * 100000 + noise * 10000))
            channel_2.append(int(ecg_val * 90000 + noise * 10000))
            channel_3.append(int(ecg_val * 95000 + noise * 10000))

        return {
            'channel_1': channel_1,
            'channel_2': channel_2,
            'channel_3': channel_3
        }

    def _generate_with_afib(self, duration_seconds):
        """Generate ECG with atrial fibrillation"""
        num_samples = int(duration_seconds * self.sampling_rate)

        channel_1 = []
        channel_2 = []
        channel_3 = []

        # Irregular R-R intervals
        next_beat = 0

        for i in range(num_samples):
            t = i / self.sampling_rate

            if i >= next_beat:
                # Irregular interval
                interval = random.uniform(0.5, 1.2)
                next_beat = i + int(interval * self.sampling_rate)

            cycle_pos = (i - (next_beat - int(0.8 * self.sampling_rate))) / (0.8 * self.sampling_rate)
            cycle_pos = max(0, min(1, cycle_pos))

            # No P waves in AFib, irregular baseline
            baseline_noise = random.gauss(0, 0.05)
            ecg_val = self._generate_ecg_point(cycle_pos) + baseline_noise

            noise = random.gauss(0, 0.03)

            channel_1.append(int(ecg_val * 100000 + noise * 10000))
            channel_2.append(int(ecg_val * 90000 + noise * 10000))
            channel_3.append(int(ecg_val * 95000 + noise * 10000))

        return {
            'channel_1': channel_1,
            'channel_2': channel_2,
            'channel_3': channel_3
        }

    def create_test_batch(self, scenario='normal', device_id='ecg-device-001'):
        """
        Create a complete test batch

        Args:
            scenario: 'normal', 'pvc', 'afib', 'tachycardia'
            device_id: Device identifier

        Returns:
            Complete batch dict ready for streaming
        """
        if scenario == 'normal':
            channels = self.generate_normal_sinus_rhythm(10, 72)
        elif scenario == 'pvc':
            channels = self.generate_with_arrhythmia(10, 'pvc')
        elif scenario == 'afib':
            channels = self.generate_with_arrhythmia(10, 'afib')
        elif scenario == 'tachycardia':
            channels = self.generate_with_arrhythmia(10, 'tachycardia')
        else:
            channels = self.generate_normal_sinus_rhythm(10)

        start_time = int(time.time() * 1000)

        batch = {
            'device_id': device_id,
            'batch_id': f'test-{start_time}',
            'start_timestamp': start_time,
            'end_timestamp': start_time + 10000,
            'duration_seconds': 10,
            'sample_rate': self.sampling_rate,
            'num_samples': len(channels['channel_1']),
            'channels': channels,
            'signal_quality': 0.85 if scenario == 'normal' else 0.75
        }

        return batch


def generate_test_datasets(output_dir='tests/data'):
    """Generate various test datasets"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    generator = ECGDataGenerator()

    # Generate different scenarios
    scenarios = [
        ('normal_sinus_rhythm', 'normal'),
        ('with_pvc', 'pvc'),
        ('atrial_fibrillation', 'afib'),
        ('tachycardia', 'tachycardia')
    ]

    for name, scenario in scenarios:
        print(f"Generating {name}...")
        batch = generator.create_test_batch(scenario)

        # Save as JSON
        filename = output_path / f'{name}.json'
        with open(filename, 'w') as f:
            json.dump(batch, f, indent=2)

        print(f"  Saved to {filename}")
        print(f"  Samples: {batch['num_samples']}")
        print(f"  Duration: {batch['duration_seconds']}s")
        print()

    # Generate a sequence of normal batches
    print("Generating sequence of 10 normal batches...")
    for i in range(10):
        batch = generator.create_test_batch('normal')
        filename = output_path / f'normal_sequence_{i:02d}.json'
        with open(filename, 'w') as f:
            json.dump(batch, f, indent=2)
        time.sleep(0.1)  # Different timestamps

    print(f"✓ Test datasets generated in {output_path}")


if __name__ == '__main__':
    generate_test_datasets()
