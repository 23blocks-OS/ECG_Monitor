'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/types';

interface PatientSearchProps {
  onPatientSelect: (patient: Patient) => void;
  organizationId: string;
}

export default function PatientSearch({ onPatientSelect, organizationId }: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch patients for the organization
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/organizations/${organizationId}/patients`);
        if (response.ok) {
          const data = await response.json();
          setPatients(data.patients || []);
        } else {
          // Mock data for development
          setPatients(getMockPatients());
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        setPatients(getMockPatients());
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [organizationId]);

  // Filter patients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients([]);
      setIsOpen(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = patients.filter(patient =>
      patient.first_name.toLowerCase().includes(query) ||
      patient.last_name.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query) ||
      patient.user_id.toLowerCase().includes(query)
    );

    setFilteredPatients(filtered);
    setIsOpen(true);
  }, [searchQuery, patients]);

  const handleSelectPatient = (patient: Patient) => {
    onPatientSelect(patient);
    setSearchQuery(`${patient.first_name} ${patient.last_name}`);
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patients by name, email, or ID..."
          className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && filteredPatients.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
          <div className="p-2">
            {filteredPatients.map((patient) => (
              <button
                key={patient.user_id}
                onClick={() => handleSelectPatient(patient)}
                className="w-full text-left p-3 hover:bg-white/10 rounded-lg transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white group-hover:text-accent-purple transition-colors">
                        {patient.first_name} {patient.last_name}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(patient.account_status)}`}></span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{patient.email}</div>
                    {patient.date_of_birth && (
                      <div className="text-xs text-gray-500 mt-1">
                        DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                      </div>
                    )}
                    {patient.current_device_id && (
                      <div className="text-xs text-accent-cyan mt-1">
                        Device: {patient.current_device_id}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {patient.user_id.slice(0, 8)}...
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {isOpen && searchQuery && filteredPatients.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-gray-400">No patients found matching "{searchQuery}"</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading patients...</p>
        </div>
      )}
    </div>
  );
}

// Mock data for development
function getMockPatients(): Patient[] {
  return [
    {
      user_id: 'patient-001-uuid',
      organization_id: 'org-001',
      email: 'john.doe@email.com',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1975-06-20',
      gender: 'male',
      phone: '+1-555-0123',
      role: 'patient',
      created_at: Date.now() - 86400000 * 30,
      account_status: 'active',
      current_device_id: 'ecg-device-001',
      last_session_timestamp: Date.now() - 3600000,
      medical_history: {
        conditions: ['hypertension'],
        medications: ['lisinopril']
      }
    },
    {
      user_id: 'patient-002-uuid',
      organization_id: 'org-001',
      email: 'jane.smith@email.com',
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1982-03-15',
      gender: 'female',
      phone: '+1-555-0124',
      role: 'patient',
      created_at: Date.now() - 86400000 * 60,
      account_status: 'active',
      current_device_id: 'ecg-device-002',
      last_session_timestamp: Date.now() - 7200000
    },
    {
      user_id: 'patient-003-uuid',
      organization_id: 'org-001',
      email: 'robert.johnson@email.com',
      first_name: 'Robert',
      last_name: 'Johnson',
      date_of_birth: '1968-11-08',
      gender: 'male',
      role: 'patient',
      created_at: Date.now() - 86400000 * 90,
      account_status: 'active',
      last_session_timestamp: Date.now() - 86400000 * 2
    },
    {
      user_id: 'patient-004-uuid',
      organization_id: 'org-001',
      email: 'mary.williams@email.com',
      first_name: 'Mary',
      last_name: 'Williams',
      date_of_birth: '1990-07-22',
      gender: 'female',
      role: 'patient',
      created_at: Date.now() - 86400000 * 15,
      account_status: 'inactive'
    }
  ];
}
