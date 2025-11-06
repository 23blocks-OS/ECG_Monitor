"""
Buffer Manager for ECG Data

Manages local buffering of ECG samples before streaming to cloud
"""

import os
import json
import gzip
import time
from collections import deque
from pathlib import Path


class ECGBuffer:
    """Circular buffer for ECG data"""

    def __init__(self, buffer_seconds=30, sampling_rate=250, cache_dir="/var/ecg_cache", max_cache_mb=500):
        """
        Initialize buffer

        Args:
            buffer_seconds: Size of in-memory buffer in seconds
            sampling_rate: Sampling rate in Hz
            cache_dir: Directory for offline disk cache
            max_cache_mb: Maximum disk cache size in MB
        """
        self.buffer_seconds = buffer_seconds
        self.sampling_rate = sampling_rate
        self.samples_per_batch = sampling_rate * buffer_seconds

        # In-memory buffer (circular queue)
        self.buffer = {
            'channel_1': deque(maxlen=self.samples_per_batch),
            'channel_2': deque(maxlen=self.samples_per_batch),
            'channel_3': deque(maxlen=self.samples_per_batch)
        }

        self.timestamps = deque(maxlen=self.samples_per_batch)

        # Disk cache for offline periods
        self.cache_dir = Path(cache_dir)
        self.max_cache_bytes = max_cache_mb * 1024 * 1024
        self.cache_enabled = True

        # Create cache directory
        try:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            print(f"Warning: Could not create cache directory: {e}")
            self.cache_enabled = False

    def add_sample(self, channel_1, channel_2, channel_3, timestamp=None):
        """
        Add one sample to buffer

        Args:
            channel_1, channel_2, channel_3: Sample values
            timestamp: Unix timestamp in milliseconds
        """
        if timestamp is None:
            timestamp = int(time.time() * 1000)

        self.buffer['channel_1'].append(channel_1)
        self.buffer['channel_2'].append(channel_2)
        self.buffer['channel_3'].append(channel_3)
        self.timestamps.append(timestamp)

    def get_batch(self, batch_seconds=10):
        """
        Get a batch of samples from buffer

        Args:
            batch_seconds: Duration of batch in seconds

        Returns:
            Dict with batch data or None if not enough samples
        """
        batch_samples = self.sampling_rate * batch_seconds

        # Check if we have enough samples
        if len(self.buffer['channel_1']) < batch_samples:
            return None

        # Get the oldest samples (FIFO)
        batch = {
            'device_id': 'ecg-device-001',  # TODO: Make configurable
            'start_timestamp': self.timestamps[0],
            'end_timestamp': self.timestamps[batch_samples - 1],
            'duration_seconds': batch_seconds,
            'sample_rate': self.sampling_rate,
            'num_samples': batch_samples,
            'channels': {
                'channel_1': list(self.buffer['channel_1'])[:batch_samples],
                'channel_2': list(self.buffer['channel_2'])[:batch_samples],
                'channel_3': list(self.buffer['channel_3'])[:batch_samples]
            }
        }

        return batch

    def clear_batch_samples(self, num_samples):
        """Remove samples from front of buffer (after successfully sent)"""
        for _ in range(num_samples):
            if len(self.buffer['channel_1']) > 0:
                self.buffer['channel_1'].popleft()
                self.buffer['channel_2'].popleft()
                self.buffer['channel_3'].popleft()
                self.timestamps.popleft()

    def cache_batch(self, batch_data):
        """
        Save batch to disk cache for offline buffering

        Args:
            batch_data: Dict with batch data

        Returns:
            bool: True if cached successfully
        """
        if not self.cache_enabled:
            return False

        try:
            # Check cache size
            if self._get_cache_size() >= self.max_cache_bytes:
                self._cleanup_old_cache()

            # Generate filename
            timestamp = batch_data['start_timestamp']
            filename = f"batch_{timestamp}.json.gz"
            filepath = self.cache_dir / filename

            # Compress and save
            json_data = json.dumps(batch_data)
            compressed = gzip.compress(json_data.encode('utf-8'))

            with open(filepath, 'wb') as f:
                f.write(compressed)

            print(f"Cached batch to disk: {filename}")
            return True

        except Exception as e:
            print(f"Error caching batch: {e}")
            return False

    def get_cached_batches(self):
        """
        Get list of cached batches from disk

        Returns:
            List of tuples (filepath, timestamp)
        """
        if not self.cache_enabled:
            return []

        try:
            batches = []
            for filepath in sorted(self.cache_dir.glob("batch_*.json.gz")):
                # Extract timestamp from filename
                timestamp_str = filepath.stem.split('_')[1]
                timestamp = int(timestamp_str)
                batches.append((filepath, timestamp))

            return batches

        except Exception as e:
            print(f"Error listing cached batches: {e}")
            return []

    def load_cached_batch(self, filepath):
        """
        Load a batch from disk cache

        Args:
            filepath: Path to cached batch file

        Returns:
            Dict with batch data or None on error
        """
        try:
            with open(filepath, 'rb') as f:
                compressed = f.read()

            decompressed = gzip.decompress(compressed)
            batch_data = json.loads(decompressed.decode('utf-8'))

            return batch_data

        except Exception as e:
            print(f"Error loading cached batch: {e}")
            return None

    def delete_cached_batch(self, filepath):
        """Delete a cached batch file"""
        try:
            filepath.unlink()
            return True
        except Exception as e:
            print(f"Error deleting cached batch: {e}")
            return False

    def _get_cache_size(self):
        """Get total size of cache directory in bytes"""
        try:
            total_size = sum(f.stat().st_size for f in self.cache_dir.glob("*") if f.is_file())
            return total_size
        except Exception:
            return 0

    def _cleanup_old_cache(self):
        """Remove oldest cached batches to free space"""
        print("Cleaning up old cache files...")

        batches = self.get_cached_batches()
        if not batches:
            return

        # Remove oldest 20%
        num_to_remove = max(1, len(batches) // 5)
        for filepath, _ in batches[:num_to_remove]:
            self.delete_cached_batch(filepath)

        print(f"Removed {num_to_remove} old cache files")

    def get_buffer_status(self):
        """Get buffer statistics"""
        return {
            'samples_in_memory': len(self.buffer['channel_1']),
            'buffer_duration_seconds': len(self.buffer['channel_1']) / self.sampling_rate,
            'cached_batches': len(self.get_cached_batches()),
            'cache_size_mb': self._get_cache_size() / (1024 * 1024),
            'cache_enabled': self.cache_enabled
        }
