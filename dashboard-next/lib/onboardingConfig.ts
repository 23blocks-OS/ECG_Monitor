import { OnboardingConfig } from '@/types/onboarding';

/**
 * Complete onboarding configuration
 * Defines all content for the first-time user journey
 */
export const onboardingConfig: OnboardingConfig = {
  mission: {
    title: "Welcome to ECG Monitor",
    subtitle: "Real-time cardiac monitoring, reimagined",
    description: [
      "ECG Monitor exists to democratize access to professional-grade cardiac health monitoring.",
      "We believe that everyone should have the ability to understand and track their heart health in real-time, whether for personal wellness, athletic performance, or medical monitoring.",
      "Built on open-source principles, this platform combines affordable ESP32 hardware with cloud-powered analytics to deliver hospital-quality ECG monitoring at a fraction of the cost."
    ],
    highlights: [
      "Real-time 3-lead ECG waveform visualization",
      "Continuous heart rate and HRV monitoring",
      "Intelligent alert system for anomaly detection",
      "Open-source and fully customizable",
      "Cloud or self-hosted deployment options"
    ]
  },

  components: [
    {
      id: 'hardware',
      name: 'ESP32 Device',
      description: 'Low-power microcontroller that captures ECG signals',
      icon: '🔌',
      color: 'from-purple-500 to-pink-500',
      details: [
        'Dual-core processor for real-time signal processing',
        'Built-in WiFi for cloud connectivity',
        'Low power consumption for portable use',
        'Connects to AD8232 ECG sensor module'
      ]
    },
    {
      id: 'sensor',
      name: 'ECG Sensor (AD8232)',
      description: 'Medical-grade analog front-end for ECG signal acquisition',
      icon: '💓',
      color: 'from-pink-500 to-red-500',
      details: [
        'Single-lead ECG signal conditioning',
        '3.5mm audio jack for electrode connection',
        'Real-time analog signal output',
        'Designed for wearable applications'
      ]
    },
    {
      id: 'backend',
      name: 'Cloud Backend',
      description: 'Scalable API for data ingestion and processing',
      icon: '☁️',
      color: 'from-cyan-500 to-blue-500',
      details: [
        'REST API for device data submission',
        'Real-time data processing pipeline',
        'Alert generation and classification',
        'Historical data storage and retrieval'
      ]
    },
    {
      id: 'dashboard',
      name: 'Web Dashboard',
      description: 'Beautiful, real-time visualization interface',
      icon: '📊',
      color: 'from-blue-500 to-purple-500',
      details: [
        '3-lead ECG waveform display',
        'Live metrics: HR, HRV, signal quality',
        'Alert notifications and history',
        'Responsive design for any device'
      ]
    }
  ],

  requirements: [
    // Hardware requirements
    {
      id: 'esp32-board',
      category: 'hardware',
      title: 'ESP32 Development Board',
      description: 'ESP32-DevKitC or compatible board with WiFi capability',
      applicableTo: ['self-deployer'],
      icon: '🖥️'
    },
    {
      id: 'ecg-sensor',
      category: 'hardware',
      title: 'AD8232 ECG Sensor Module',
      description: 'Single-lead ECG sensor breakout board',
      applicableTo: ['self-deployer'],
      icon: '🔬'
    },
    {
      id: 'electrodes',
      category: 'hardware',
      title: 'ECG Electrodes & Cables',
      description: '3-lead disposable electrodes with 3.5mm connector',
      applicableTo: ['self-deployer', 'managed-user'],
      icon: '🔗'
    },
    {
      id: 'power-supply',
      category: 'hardware',
      title: 'USB Power Supply',
      description: 'Micro-USB cable and 5V power adapter',
      applicableTo: ['self-deployer', 'managed-user'],
      icon: '🔋'
    },

    // Software requirements
    {
      id: 'arduino-ide',
      category: 'software',
      title: 'Arduino IDE or PlatformIO',
      description: 'Development environment for ESP32 firmware',
      applicableTo: ['self-deployer'],
      icon: '💻'
    },
    {
      id: 'esp32-libraries',
      category: 'software',
      title: 'ESP32 Board Support',
      description: 'ESP32 core libraries and WiFi support',
      applicableTo: ['self-deployer'],
      icon: '📚'
    },

    // Network requirements
    {
      id: 'wifi-network',
      category: 'network',
      title: 'WiFi Network',
      description: '2.4GHz WiFi network with internet access',
      applicableTo: ['self-deployer', 'managed-user'],
      icon: '📡'
    },
    {
      id: 'api-endpoint',
      category: 'network',
      title: 'API Endpoint',
      description: 'Backend API URL for data submission',
      applicableTo: ['self-deployer', 'managed-user'],
      icon: '🌐'
    },

    // Optional requirements
    {
      id: 'docker',
      category: 'optional',
      title: 'Docker (Optional)',
      description: 'For containerized backend deployment',
      applicableTo: ['self-deployer'],
      icon: '🐳'
    },
    {
      id: 'cloud-account',
      category: 'optional',
      title: 'Cloud Provider Account (Optional)',
      description: 'AWS, GCP, or Azure for cloud deployment',
      applicableTo: ['self-deployer'],
      icon: '☁️'
    }
  ],

  setupSteps: [
    {
      id: 'hardware-assembly',
      title: 'Assemble Your Hardware',
      description: 'Connect the ESP32 to the AD8232 ECG sensor',
      applicableTo: ['self-deployer'],
      estimatedTime: '15 minutes',
      substeps: [
        {
          title: 'Connect AD8232 to ESP32',
          description: 'Wire the ECG sensor to your ESP32 board using the following pin connections:',
          code: `AD8232 OUTPUT → ESP32 GPIO 34 (ADC1_CH6)
AD8232 LO+ → ESP32 GPIO 26
AD8232 LO- → ESP32 GPIO 27
AD8232 3.3V → ESP32 3.3V
AD8232 GND → ESP32 GND`,
          important: true
        },
        {
          title: 'Attach electrodes',
          description: 'Connect the 3-lead electrode cable to the AD8232 3.5mm jack. Do not attach to skin yet.'
        },
        {
          title: 'Power check',
          description: 'Connect ESP32 via USB to your computer. The LED should illuminate, confirming power.'
        }
      ]
    },

    {
      id: 'firmware-flash',
      title: 'Flash ESP32 Firmware',
      description: 'Upload the ECG monitoring firmware to your ESP32',
      applicableTo: ['self-deployer'],
      estimatedTime: '10 minutes',
      substeps: [
        {
          title: 'Install Arduino IDE',
          description: 'Download and install Arduino IDE from arduino.cc, or use PlatformIO in VS Code.'
        },
        {
          title: 'Add ESP32 board support',
          description: 'In Arduino IDE, go to Preferences and add this URL to "Additional Board Manager URLs":',
          code: 'https://dl.espressif.com/dl/package_esp32_index.json'
        },
        {
          title: 'Install ESP32 boards',
          description: 'Open Tools > Board > Boards Manager, search for "esp32", and install the ESP32 package.'
        },
        {
          title: 'Configure WiFi credentials',
          description: 'Open the firmware code and update your WiFi SSID and password:',
          code: `const char* ssid = "Your_WiFi_Name";
const char* password = "Your_WiFi_Password";
const char* apiEndpoint = "https://your-api-url.com";`,
          important: true
        },
        {
          title: 'Upload to ESP32',
          description: 'Select the correct board (ESP32 Dev Module) and port, then click Upload.'
        }
      ]
    },

    {
      id: 'backend-deployment',
      title: 'Deploy the Backend API',
      description: 'Set up the cloud backend for data processing',
      applicableTo: ['self-deployer'],
      estimatedTime: '20 minutes',
      substeps: [
        {
          title: 'Choose deployment method',
          description: 'You can deploy using Docker, serverless (AWS Lambda), or a traditional server.'
        },
        {
          title: 'Set environment variables',
          description: 'Configure your API with necessary environment variables:',
          code: `DATABASE_URL=your_database_connection_string
CORS_ORIGINS=https://your-dashboard-url.com
JWT_SECRET=your_secure_random_string`,
          important: true
        },
        {
          title: 'Deploy and test',
          description: 'Deploy your backend and verify it\'s responding at /api/health endpoint.'
        },
        {
          title: 'Note your API URL',
          description: 'Save your API endpoint URL - you\'ll need this for device configuration.',
          important: true
        }
      ]
    },

    {
      id: 'device-connection',
      title: 'Connect Your Device',
      description: 'Link your ECG device to the monitoring system',
      applicableTo: ['self-deployer', 'managed-user'],
      estimatedTime: '5 minutes',
      substeps: [
        {
          title: 'Power on the device',
          description: 'Connect your ESP32 to power via USB. The device will attempt to connect to WiFi.'
        },
        {
          title: 'Verify connection',
          description: 'Check the Serial Monitor (if self-deploying) or look for a steady LED pattern indicating successful connection.',
          important: true
        },
        {
          title: 'Position electrodes',
          description: 'Attach the 3 ECG electrodes to your body: Right arm (RA), Left arm (LA), and Right leg (RL - ground).'
        },
        {
          title: 'Verify data flow',
          description: 'Your dashboard should now show live ECG data. If not, check WiFi and API configuration.'
        }
      ]
    },

    {
      id: 'dashboard-access',
      title: 'Access Your Dashboard',
      description: 'Open the web interface to view your ECG data',
      applicableTo: ['self-deployer', 'managed-user'],
      estimatedTime: '2 minutes',
      substeps: [
        {
          title: 'Open the dashboard URL',
          description: 'Navigate to your dashboard URL in a modern web browser (Chrome, Firefox, Safari, or Edge).'
        },
        {
          title: 'Verify live data',
          description: 'You should see real-time ECG waveforms, heart rate, HRV, and signal quality metrics.',
          important: true
        },
        {
          title: 'Explore features',
          description: 'Check out the alerts section, historical data, and various metric visualizations.'
        }
      ]
    }
  ]
};
