"""
Data Compression for ECG Batches

Compresses ECG data before transmission to reduce bandwidth
"""

import json
import gzip
import base64


class DataCompressor:
    """Compress ECG data batches"""

    def __init__(self, compression_level=6):
        """
        Initialize compressor

        Args:
            compression_level: gzip compression level (1-9, default 6)
        """
        self.compression_level = compression_level

    def compress_batch(self, batch_data):
        """
        Compress batch data

        Args:
            batch_data: Dict with batch data

        Returns:
            Dict with compressed data and metadata
        """
        # Convert to JSON
        json_data = json.dumps(batch_data)
        original_size = len(json_data)

        # Compress
        compressed = gzip.compress(
            json_data.encode('utf-8'),
            compresslevel=self.compression_level
        )

        # Base64 encode for JSON transmission
        compressed_b64 = base64.b64encode(compressed).decode('ascii')

        compressed_size = len(compressed_b64)
        compression_ratio = (1 - compressed_size / original_size) * 100

        return {
            'data': compressed_b64,
            'compressed': True,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'compression_ratio': round(compression_ratio, 1),
            'device_id': batch_data.get('device_id'),
            'start_timestamp': batch_data.get('start_timestamp'),
            'batch_metadata': {
                'duration_seconds': batch_data.get('duration_seconds'),
                'sample_rate': batch_data.get('sample_rate'),
                'num_samples': batch_data.get('num_samples'),
                'signal_quality': batch_data.get('signal_quality', 0.0)
            }
        }

    def decompress_batch(self, compressed_data):
        """
        Decompress batch data

        Args:
            compressed_data: Dict with compressed data

        Returns:
            Dict with original batch data
        """
        # Decode base64
        compressed_bytes = base64.b64decode(compressed_data['data'])

        # Decompress
        decompressed = gzip.decompress(compressed_bytes)

        # Parse JSON
        batch_data = json.loads(decompressed.decode('utf-8'))

        return batch_data
