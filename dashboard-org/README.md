# ECG Provider Portal - Organization Dashboard

A comprehensive provider portal for ECG monitoring built with **Next.js 14**, **React 18**, **TypeScript**, and **Tailwind CSS**. This portal allows healthcare professionals to manage and monitor multiple patients within their organization.

---

## Overview

The **Provider Portal** is the organization-level interface for the ECG Monitor system, enabling doctors, nurses, and administrators to:

- **Search and select patients** from their organization
- **View real-time ECG data** for any patient
- **Monitor organization-wide statistics** and metrics
- **Access patient health histories** and medical information
- **Manage multi-patient monitoring** workflows

This complements the **Patient Portal** (`dashboard-next`) which is designed for individual users to view their own ECG data.

---

## Key Features

### 🔐 Authentication & Authorization
- **Organization-based login** for healthcare providers
- **Role-based access control** (doctor, nurse, admin, patient)
- **Secure session management** with localStorage
- **Organization context** enforcement

### 👥 Patient Management
- **Advanced patient search** by name, email, or ID
- **Patient list view** with activity summaries
- **Detailed patient profiles** with medical history
- **Device assignment tracking**

### 📊 Organization Dashboard
- **Real-time statistics** overview
  - Total and active patients
  - Device utilization
  - Daily sessions and alerts
- **Organization settings** and subscription info
- **Capacity monitoring** (users/devices)

### 🫀 ECG Monitoring
- **Patient-specific ECG dashboards** (reuses dashboard-next components)
- **Real-time waveform visualization** for 3-lead ECG
- **Heart rate, HRV, and signal quality** metrics
- **Alert management** with severity tracking

### 🎨 Modern UI/UX
- **Glassmorphism** design with backdrop blur
- **Gradient accents** and smooth animations
- **Responsive layout** (mobile-first)
- **Dark theme** optimized for medical workflows

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Animations**: GSAP 3.12 + Framer Motion
- **Charts**: Chart.js 4.4 + react-chartjs-2
- **State Management**: React Context (Auth)

---

## Getting Started

### Installation

```bash
cd dashboard-org

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to the login page.

### Development Login

In development mode, **any credentials will work** for testing:

```
Email: doctor@clinic.com
Password: [anything]
```

This will log you in as:
- **User**: Dr. Robert Johnson
- **Organization**: Downtown Family Clinic
- **Role**: Doctor

---

## Environment Variables

Create a `.env.local` file:

```env
# Backend API endpoint (optional - uses mock data by default)
NEXT_PUBLIC_API_URL=https://your-api-gateway-url

# Example for deployed Lambda API
NEXT_PUBLIC_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

---

## User Workflows

### 1. Provider Login

```
1. Navigate to / → Redirects to login page
2. Enter credentials
3. AuthProvider validates and stores session
4. Redirect to /patients (patient list page)
```

### 2. Search and View Patient

```
1. On /patients page, use search bar
2. Type patient name, email, or ID
3. Autocomplete dropdown appears
4. Click on patient to select
5. Patient card displays with details
6. Click "View ECG Dashboard"
7. Navigate to /dashboard/[patientId]
8. View real-time ECG data for that patient
```

### 3. Monitor Organization Stats

```
1. On /patients page, view OrganizationStats component
2. See:
   - Total/active patients
   - Device utilization
   - Today's sessions and alerts
   - Organization capacity
3. Click refresh to update stats
```

---

## API Integration

### Mock Data Mode (Default)

The portal runs with realistic mock data when `NEXT_PUBLIC_API_URL` is not set. Perfect for development and demos.

### Backend API Mode

When connected to a real backend, the portal expects these endpoints:

#### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@clinic.com",
  "password": "********"
}
```

#### Patient Management

```http
# Get all patients in organization
GET /api/organizations/{organizationId}/patients

# Get specific patient
GET /api/patients/{patientId}

# Get patient summaries (with stats)
GET /api/organizations/{organizationId}/patient-summaries
```

#### ECG Data (by patient's device_id)

```http
# Get live ECG data
GET /api/live?device_id={deviceId}

# Get alerts
GET /api/alerts?device_id={deviceId}&hours=24

# Get historical data
GET /api/history?device_id={deviceId}
```

---

## Component Reuse

The Provider Portal **reuses components** from the Patient Portal (`dashboard-next`):

### Shared Components
- `Header.tsx` - Dashboard header (with customTitle support)
- `MetricCard.tsx` - ECG metric display cards
- `ECGChart.tsx` - Chart.js waveform visualization
- `AlertItem.tsx` - Alert notifications
- `ParticlesBackground.tsx` - Animated background

### Provider-Specific Components
- `AuthWrapper.tsx` - Organization-based authentication
- `PatientSearch.tsx` - Patient search with autocomplete
- `PatientCard.tsx` - Patient profile display
- `OrganizationStats.tsx` - Organization statistics dashboard

---

## Comparison: Patient Portal vs Provider Portal

| Feature | Patient Portal | Provider Portal |
|---------|---------------|-----------------|
| **Purpose** | Personal health monitoring | Professional patient management |
| **Authentication** | Optional/Simple | **Required** with org context |
| **User Count** | Single user | Multiple patients |
| **Navigation** | Direct to dashboard | **Search → Select → View** |
| **Data Scope** | Own data only | **All patients in organization** |
| **Role Support** | No | **Yes** (doctor/nurse/admin) |
| **Org Stats** | No | **Yes** |
| **Patient Search** | No | **Yes** |

---

## Medical Disclaimer

⚠️ **IMPORTANT NOTICE:**

- This is a **software development project**, not a medical device
- **NOT intended for clinical diagnosis or treatment decisions**
- **NOT FDA approved** or CE marked
- Always consult qualified healthcare professionals for medical advice
- Use at your own risk

---

## Related Documentation

- [Main Project README](../README.md) - ECG Monitor System overview
- [Patient Portal README](../dashboard-next/README.md) - Individual user dashboard
- [Multi-Tenant Guide](../MULTI_TENANT_GUIDE.md) - Deployment modes
- [Health Data Schema](../HEALTH_DATA_SCHEMA.md) - Database structure

---

## Contact & Support

**Project**: ECG Monitor - AI-Powered Portable ECG System
**Author**: Juan Pelaez
**GitHub**: [@23blocks-OS](https://github.com/23blocks-OS)
**Repository**: [ECG_Monitor](https://github.com/23blocks-OS/ECG_Monitor)

For issues and questions, please open an issue on GitHub.
