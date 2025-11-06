# ECG Monitor Project Structure

```
ECG_Monitor/
├── README.md                          # Project overview
├── ARCHITECTURE.md                    # System architecture (detailed)
├── PROJECT_STRUCTURE.md              # This file
├── LICENSE                           # Project license
│
├── config/                           # Configuration files
│   ├── pi-config.yaml               # Raspberry Pi configuration
│   ├── aws-config.yaml              # AWS resource configuration
│   └── secrets.template.yaml        # Template for secrets
│
├── pi-collector/                    # Raspberry Pi ECG data collector
│   ├── README.md                    # Setup instructions
│   ├── requirements.txt             # Python dependencies
│   ├── main.py                      # Entry point
│   ├── ecg_reader.py               # ADS1293 SPI interface
│   ├── signal_processor.py         # Basic filtering/processing
│   ├── buffer_manager.py           # Local data buffering
│   └── config.py                   # Configuration loader
│
├── pi-streamer/                     # Cloud streaming component
│   ├── README.md                    # Setup instructions
│   ├── requirements.txt             # Python dependencies
│   ├── main.py                      # Entry point
│   ├── iot_client.py               # AWS IoT Core MQTT client
│   ├── data_compressor.py          # Data compression
│   ├── offline_buffer.py           # Offline storage handler
│   └── config.py                   # Configuration loader
│
├── aws-infrastructure/              # AWS cloud components
│   │
│   ├── cloudformation/             # Infrastructure as Code
│   │   ├── main-stack.yaml        # Master stack
│   │   ├── iot-resources.yaml     # IoT Core, rules
│   │   ├── storage-resources.yaml # S3, DynamoDB
│   │   ├── compute-resources.yaml # Lambda, SQS
│   │   └── api-resources.yaml     # API Gateway
│   │
│   ├── lambda/                     # Lambda function code
│   │   │
│   │   ├── ecg-preprocessor/      # Data preprocessing
│   │   │   ├── handler.py
│   │   │   ├── requirements.txt
│   │   │   └── utils.py
│   │   │
│   │   ├── ecg-ai-analyzer/       # Claude API integration
│   │   │   ├── handler.py
│   │   │   ├── requirements.txt
│   │   │   ├── claude_client.py
│   │   │   └── prompts.py
│   │   │
│   │   ├── ecg-alert-worker/      # Alert notifications
│   │   │   ├── handler.py
│   │   │   ├── requirements.txt
│   │   │   └── email_templates.py
│   │   │
│   │   └── ecg-api-handler/       # API Gateway handler
│   │       ├── handler.py
│   │       ├── requirements.txt
│   │       └── queries.py
│   │
│   └── scripts/                    # Deployment scripts
│       ├── deploy.sh               # Main deployment script
│       ├── setup-iot-device.sh    # IoT device provisioning
│       └── cleanup.sh              # Resource cleanup
│
├── web-dashboard/                   # Web visualization dashboard
│   ├── index.html                  # Main page
│   ├── js/
│   │   ├── app.js                 # Main application
│   │   ├── api-client.js          # API Gateway client
│   │   ├── ecg-chart.js           # Chart rendering
│   │   └── alerts.js              # Alert display
│   ├── css/
│   │   └── styles.css             # Dashboard styling
│   └── assets/
│       └── logo.png               # Branding
│
├── docs/                           # Documentation
│   ├── setup-raspberry-pi.md      # Pi setup guide
│   ├── aws-deployment.md          # AWS deployment guide
│   ├── claude-api-setup.md        # Claude API configuration
│   ├── troubleshooting.md         # Common issues
│   └── api-reference.md           # API documentation
│
└── tests/                          # Testing
    ├── unit/                       # Unit tests
    ├── integration/                # Integration tests
    └── mock_data/                  # Test data samples
        └── sample_ecg.json
```

## Component Descriptions

### Raspberry Pi Components

**pi-collector/**
- Interfaces directly with CJMCU-1293 hardware
- Handles SPI communication with ADS1293 chip
- Performs basic signal filtering
- Manages local buffering

**pi-streamer/**
- Connects to AWS IoT Core via MQTT
- Batches and compresses ECG data
- Handles network failures with offline buffering
- Manages device certificates

### AWS Infrastructure

**cloudformation/**
- Defines all AWS resources
- Separate stacks for modularity
- Easy deployment and teardown

**lambda/**
- Serverless processing functions
- Event-driven architecture
- Each function has isolated dependencies

### Web Dashboard

**web-dashboard/**
- Static site hosted on S3
- Real-time chart updates
- Responsive design
- API client for backend communication

### Documentation

**docs/**
- Step-by-step setup guides
- Troubleshooting resources
- API reference

## Development Workflow

1. **Local Development:**
   - Develop Pi components on Raspberry Pi
   - Test Lambda functions locally (SAM CLI)
   - Test dashboard with mock data

2. **Deployment:**
   - Deploy AWS infrastructure via CloudFormation
   - Upload Lambda code
   - Configure IoT device certificates
   - Deploy dashboard to S3

3. **Testing:**
   - Unit tests for each component
   - Integration tests for data flow
   - End-to-end testing with real hardware

## Dependencies

### Raspberry Pi
- Python 3.9+
- SPI enabled
- Internet connectivity

### AWS Account
- Active AWS account
- CLI configured
- Appropriate IAM permissions

### External APIs
- Anthropic Claude API key
- Email address for SES verification
