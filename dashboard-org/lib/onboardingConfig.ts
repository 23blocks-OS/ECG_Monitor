import { OnboardingConfig } from '@/types/onboarding';

/**
 * Organization dashboard onboarding configuration
 * Tailored for healthcare providers managing multiple patients
 */
export const onboardingConfig: OnboardingConfig = {
  mission: {
    title: "Welcome to ECG Provider Portal",
    subtitle: "Professional multi-patient cardiac monitoring",
    description: [
      "The ECG Provider Portal empowers healthcare organizations to monitor multiple patients simultaneously with enterprise-grade features.",
      "Built for clinics, hospitals, and research institutions, this platform enables real-time patient monitoring, data analysis, and alert management across your entire organization.",
      "Streamline your cardiac care workflow with centralized patient management, customizable alerts, and comprehensive reporting tools."
    ],
    highlights: [
      "Multi-patient dashboard with real-time monitoring",
      "Organization-wide patient and device management",
      "Role-based access control for your team",
      "Advanced analytics and reporting tools",
      "Configurable alert thresholds per patient"
    ]
  },

  components: [
    {
      id: 'portal',
      name: 'Provider Portal',
      description: 'Centralized web interface for managing all patients',
      icon: '🏥',
      color: 'from-purple-500 to-pink-500',
      details: [
        'Patient search and selection interface',
        'Organization statistics dashboard',
        'Quick access to patient ECG data',
        'Responsive design for clinic workstations'
      ]
    },
    {
      id: 'patient-mgmt',
      name: 'Patient Management',
      description: 'Comprehensive patient record and device assignment system',
      icon: '👥',
      color: 'from-pink-500 to-red-500',
      details: [
        'Patient profile management',
        'Device assignment and tracking',
        'Medical history documentation',
        'Session monitoring and alerts'
      ]
    },
    {
      id: 'monitoring',
      name: 'Real-time Monitoring',
      description: 'Live ECG viewing and alert management for each patient',
      icon: '📊',
      color: 'from-cyan-500 to-blue-500',
      details: [
        'Per-patient ECG waveform visualization',
        'Real-time vital sign monitoring',
        'Intelligent alert classification',
        'Historical data comparison'
      ]
    },
    {
      id: 'access-control',
      name: 'Access Control',
      description: 'Role-based permissions and audit logging',
      icon: '🔐',
      color: 'from-blue-500 to-purple-500',
      details: [
        'Provider and staff account management',
        'Role-based permissions (admin, provider, viewer)',
        'Audit trail for compliance',
        'Organization-wide settings'
      ]
    }
  ],

  requirements: [
    // Access requirements
    {
      id: 'provider-account',
      category: 'software',
      title: 'Provider Account',
      description: 'Authenticated account with provider or admin role in your organization',
      applicableTo: ['self-deployer', 'managed-user'],
      icon: '👤'
    },
    {
      id: 'organization-setup',
      category: 'software',
      title: 'Organization Configuration',
      description: 'Your organization must be configured with subscription and settings',
      applicableTo: ['self-deployer'],
      icon: '🏢'
    },

    // Patient requirements
    {
      id: 'patient-devices',
      category: 'hardware',
      title: 'Patient ECG Devices',
      description: 'Each monitored patient needs an assigned ESP32 ECG device',
      applicableTo: ['self-deployer', 'managed-user'],
      icon: '📱'
    },
    {
      id: 'network-infrastructure',
      category: 'network',
      title: 'Clinic Network',
      description: 'Secure WiFi network for patient devices and workstations',
      applicableTo: ['self-deployer', 'managed-user'],
      icon: '📡'
    },

    // Backend requirements
    {
      id: 'backend-api',
      category: 'software',
      title: 'Backend API with Multi-tenancy',
      description: 'Organization-aware API endpoints for patient data isolation',
      applicableTo: ['self-deployer'],
      icon: '☁️'
    },
    {
      id: 'database',
      category: 'software',
      title: 'Secure Database',
      description: 'HIPAA-compliant database for patient data storage',
      applicableTo: ['self-deployer'],
      icon: '🗄️'
    },

    // Optional requirements
    {
      id: 'sso',
      category: 'optional',
      title: 'Single Sign-On (Optional)',
      description: 'Integrate with existing hospital authentication systems',
      applicableTo: ['self-deployer'],
      icon: '🔑'
    },
    {
      id: 'hl7-integration',
      category: 'optional',
      title: 'HL7/FHIR Integration (Optional)',
      description: 'Connect to electronic health record systems',
      applicableTo: ['self-deployer'],
      icon: '🔗'
    }
  ],

  setupSteps: [
    {
      id: 'organization-setup',
      title: 'Configure Your Organization',
      description: 'Set up organization profile and subscription',
      applicableTo: ['self-deployer'],
      estimatedTime: '10 minutes',
      substeps: [
        {
          title: 'Create organization record',
          description: 'Define your organization details in the database:',
          code: `{
  "organization_name": "Your Clinic Name",
  "organization_type": "clinic|hospital|research",
  "subscription_tier": "professional|enterprise",
  "settings": {
    "default_alert_thresholds": {...},
    "data_retention_days": 365
  }
}`,
          important: true
        },
        {
          title: 'Configure authentication',
          description: 'Set up provider accounts and role assignments for your team.'
        },
        {
          title: 'Customize alert thresholds',
          description: 'Define default ECG alert parameters for your organization.'
        }
      ]
    },

    {
      id: 'patient-enrollment',
      title: 'Enroll Your First Patient',
      description: 'Add patients to your organization',
      applicableTo: ['self-deployer', 'managed-user'],
      estimatedTime: '5 minutes',
      substeps: [
        {
          title: 'Add patient profile',
          description: 'Navigate to the patient management section and click "Add Patient".',
          important: true
        },
        {
          title: 'Enter patient information',
          description: 'Provide required details: name, date of birth, medical record number, and consent documentation.'
        },
        {
          title: 'Assign device',
          description: 'Link an ECG device to the patient by entering the device ID.'
        },
        {
          title: 'Configure monitoring parameters',
          description: 'Set patient-specific alert thresholds if different from organizational defaults.'
        }
      ]
    },

    {
      id: 'device-deployment',
      title: 'Deploy Patient Devices',
      description: 'Set up and distribute ECG devices to patients',
      applicableTo: ['self-deployer', 'managed-user'],
      estimatedTime: '15 minutes per patient',
      substeps: [
        {
          title: 'Configure device for organization',
          description: 'Flash the ESP32 firmware with your organization\'s API endpoint and credentials:',
          code: `const char* apiEndpoint = "https://your-org-api.com";
const char* orgId = "your-org-id";
const char* deviceId = "patient-device-001";`,
          important: true
        },
        {
          title: 'Test device connectivity',
          description: 'Power on the device and verify it connects to your API and shows up in the portal.'
        },
        {
          title: 'Provide to patient',
          description: 'Give the device to the patient with instructions on electrode placement and usage.'
        },
        {
          title: 'Verify live data',
          description: 'Check the portal to confirm real-time ECG data is streaming from the patient device.'
        }
      ]
    },

    {
      id: 'team-onboarding',
      title: 'Add Team Members',
      description: 'Set up accounts for your clinical staff',
      applicableTo: ['self-deployer', 'managed-user'],
      estimatedTime: '3 minutes per user',
      substeps: [
        {
          title: 'Invite team members',
          description: 'Send invitations to providers, nurses, and support staff who need access.'
        },
        {
          title: 'Assign roles',
          description: 'Set appropriate permissions: Admin (full access), Provider (patient management), Viewer (read-only).',
          important: true
        },
        {
          title: 'Configure notifications',
          description: 'Set up alert routing so the right team members are notified of critical events.'
        }
      ]
    },

    {
      id: 'portal-usage',
      title: 'Start Monitoring Patients',
      description: 'Learn how to use the provider portal',
      applicableTo: ['self-deployer', 'managed-user'],
      estimatedTime: '5 minutes',
      substeps: [
        {
          title: 'Search for patients',
          description: 'Use the search bar to find patients by name or medical record number.'
        },
        {
          title: 'View patient dashboard',
          description: 'Click on a patient to see their live ECG, vitals, and alert history.',
          important: true
        },
        {
          title: 'Review alerts',
          description: 'Check the alerts section to see any anomalies detected across all patients.'
        },
        {
          title: 'Export data',
          description: 'Generate reports for clinical documentation or research purposes.'
        }
      ]
    }
  ]
};
