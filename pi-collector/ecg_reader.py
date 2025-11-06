"""
CJMCU-1293 (ADS1293) ECG Reader

Interfaces with the ADS1293 3-channel ECG AFE via SPI
"""

import spidev
import RPi.GPIO as GPIO
import time
import struct
from typing import List, Tuple

# ADS1293 Register Addresses
REG_CONFIG = 0x01
REG_FLEX_CH1_CN = 0x0F
REG_FLEX_CH2_CN = 0x11
REG_FLEX_CH3_CN = 0x13
REG_CMDET_EN = 0x15
REG_RLD_CN = 0x16
REG_OSC_CN = 0x18
REG_AFE_RES = 0x1A
REG_AFE_SHDN_CN = 0x1B
REG_R2_RATE = 0x21
REG_R3_RATE = 0x22
REG_DRDYB_SRC = 0x27
REG_CH_CNFG = 0x2F

# Register values
SAMPLING_RATE_250HZ = 0x03
SAMPLING_RATE_500HZ = 0x02


class CJMCU1293:
    """Driver for CJMCU-1293 (ADS1293) 3-channel ECG module"""

    def __init__(self, spi_bus=0, spi_device=0, spi_speed=1000000,
                 gpio_reset=17, gpio_drdy=27, sampling_rate=250):
        """
        Initialize CJMCU-1293

        Args:
            spi_bus: SPI bus number
            spi_device: SPI device number
            spi_speed: SPI clock speed in Hz
            gpio_reset: GPIO pin for RESET
            gpio_drdy: GPIO pin for DRDY (Data Ready)
            sampling_rate: Sampling rate in Hz (250 or 500)
        """
        self.spi_bus = spi_bus
        self.spi_device = spi_device
        self.spi_speed = spi_speed
        self.gpio_reset = gpio_reset
        self.gpio_drdy = gpio_drdy
        self.sampling_rate = sampling_rate

        self.spi = None
        self.is_initialized = False

    def initialize(self):
        """Initialize SPI and GPIO, configure ADS1293"""
        print("Initializing CJMCU-1293 (ADS1293)...")

        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        GPIO.setup(self.gpio_reset, GPIO.OUT)
        GPIO.setup(self.gpio_drdy, GPIO.IN)

        # Setup SPI
        self.spi = spidev.SpiDev()
        self.spi.open(self.spi_bus, self.spi_device)
        self.spi.max_speed_hz = self.spi_speed
        self.spi.mode = 0b01  # CPOL=0, CPHA=1

        # Hardware reset
        self._reset()

        # Configure device
        self._configure()

        self.is_initialized = True
        print(f"CJMCU-1293 initialized at {self.sampling_rate} Hz")

    def _reset(self):
        """Hardware reset via GPIO"""
        GPIO.output(self.gpio_reset, GPIO.LOW)
        time.sleep(0.01)
        GPIO.output(self.gpio_reset, GPIO.HIGH)
        time.sleep(0.1)

    def _write_register(self, register, value):
        """Write to ADS1293 register"""
        # Write command: 0x40 | (register & 0x3F)
        cmd = [0x40 | (register & 0x3F), value]
        self.spi.xfer2(cmd)
        time.sleep(0.001)

    def _read_register(self, register):
        """Read from ADS1293 register"""
        # Read command: 0x80 | (register & 0x3F)
        cmd = [0x80 | (register & 0x3F), 0x00]
        result = self.spi.xfer2(cmd)
        return result[1]

    def _configure(self):
        """Configure ADS1293 for 3-channel ECG"""
        print("Configuring ADS1293 registers...")

        # Stop data conversion
        self._write_register(REG_CONFIG, 0x00)
        time.sleep(0.01)

        # Configure sampling rate
        if self.sampling_rate == 250:
            rate_reg = SAMPLING_RATE_250HZ
        elif self.sampling_rate == 500:
            rate_reg = SAMPLING_RATE_500HZ
        else:
            rate_reg = SAMPLING_RATE_250HZ

        self._write_register(REG_R2_RATE, rate_reg)
        self._write_register(REG_R3_RATE, rate_reg)

        # Configure channels (enable all 3 channels)
        self._write_register(REG_FLEX_CH1_CN, 0x11)  # Channel 1: Input 1N-1P
        self._write_register(REG_FLEX_CH2_CN, 0x19)  # Channel 2: Input 2N-2P
        self._write_register(REG_FLEX_CH3_CN, 0x1E)  # Channel 3: Input 3N-3P

        # Configure AFE
        self._write_register(REG_AFE_SHDN_CN, 0x00)  # Power up all channels
        self._write_register(REG_AFE_RES, 0x00)      # High resolution

        # Configure DRDY source
        self._write_register(REG_DRDYB_SRC, 0x08)    # DRDY from R3

        # Channel configuration
        self._write_register(REG_CH_CNFG, 0x07)      # Enable channels 1, 2, 3

        # Start continuous conversion
        self._write_register(REG_CONFIG, 0x01)
        time.sleep(0.1)

        print("ADS1293 configured and started")

    def read_sample(self) -> Tuple[int, int, int]:
        """
        Read one sample from all 3 channels

        Returns:
            Tuple of (channel1, channel2, channel3) as 24-bit signed integers
        """
        if not self.is_initialized:
            raise RuntimeError("Device not initialized")

        # Wait for data ready
        # In production, use GPIO interrupt for better efficiency
        timeout = 0.01  # 10ms timeout
        start_time = time.time()
        while GPIO.input(self.gpio_drdy) == GPIO.HIGH:
            if time.time() - start_time > timeout:
                raise TimeoutError("Data ready timeout")
            time.sleep(0.0001)

        # Read 9 bytes (3 bytes per channel × 3 channels)
        # Read command: 0x80 (read) | 0x00 (auto-increment)
        cmd = [0x80] + [0x00] * 9
        result = self.spi.xfer2(cmd)

        # Parse 24-bit signed integers
        data = result[1:]  # Skip command byte

        ch1 = self._bytes_to_int24(data[0:3])
        ch2 = self._bytes_to_int24(data[3:6])
        ch3 = self._bytes_to_int24(data[6:9])

        return (ch1, ch2, ch3)

    def _bytes_to_int24(self, bytes_data):
        """Convert 3 bytes to 24-bit signed integer"""
        # MSB first
        value = (bytes_data[0] << 16) | (bytes_data[1] << 8) | bytes_data[2]

        # Convert to signed
        if value & 0x800000:  # Check sign bit
            value = value - 0x1000000

        return value

    def read_continuous(self, num_samples):
        """
        Read multiple samples continuously

        Args:
            num_samples: Number of samples to read

        Returns:
            List of (ch1, ch2, ch3) tuples
        """
        samples = []
        for _ in range(num_samples):
            try:
                sample = self.read_sample()
                samples.append(sample)
            except TimeoutError:
                print("Warning: Sample timeout, skipping")
                continue

        return samples

    def close(self):
        """Clean up resources"""
        if self.spi:
            self.spi.close()
        GPIO.cleanup()
        self.is_initialized = False
        print("CJMCU-1293 closed")


# Mock ECG reader for development/testing without hardware
class MockCJMCU1293:
    """Mock CJMCU-1293 for testing without hardware"""

    def __init__(self, **kwargs):
        self.sampling_rate = kwargs.get('sampling_rate', 250)
        self.is_initialized = False

    def initialize(self):
        print("Mock CJMCU-1293 initialized")
        self.is_initialized = True

    def read_sample(self):
        """Generate mock ECG sample"""
        import math
        import random

        t = time.time()
        # Simulate ECG waveform
        ch1 = int(math.sin(t * 6 * math.pi) * 100000 + random.randint(-5000, 5000))
        ch2 = int(math.sin(t * 6 * math.pi + 0.5) * 90000 + random.randint(-5000, 5000))
        ch3 = int(math.sin(t * 6 * math.pi + 1.0) * 95000 + random.randint(-5000, 5000))

        # Simulate sampling rate timing
        time.sleep(1 / self.sampling_rate)

        return (ch1, ch2, ch3)

    def read_continuous(self, num_samples):
        samples = []
        for _ in range(num_samples):
            samples.append(self.read_sample())
        return samples

    def close(self):
        self.is_initialized = False
        print("Mock CJMCU-1293 closed")
