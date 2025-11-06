'use client';

import { Patient } from '@/types';

interface PatientCardProps {
  patient: Patient;
  onClearSelection?: () => void;
}

export default function PatientCard({ patient, onClearSelection }: PatientCardProps) {
  const formatDate = (timestamp: number | string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAge = (dob?: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge(patient.date_of_birth);

  return (
    <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-2xl font-bold text-white">
            {patient.first_name[0]}{patient.last_name[0]}
          </div>

          {/* Patient Info */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {patient.first_name} {patient.last_name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(patient.account_status)}`}></span>
              <span className="capitalize">{patient.account_status}</span>
              {age && <span>• {age} years old</span>}
              {patient.gender && <span>• {patient.gender}</span>}
            </div>
          </div>
        </div>

        {/* Clear Selection Button */}
        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
            title="Clear selection"
          >
            <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Patient Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
        {/* Contact Info */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Email</p>
          <p className="text-sm text-white truncate">{patient.email}</p>
        </div>

        {patient.phone && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Phone</p>
            <p className="text-sm text-white">{patient.phone}</p>
          </div>
        )}

        {patient.date_of_birth && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Date of Birth</p>
            <p className="text-sm text-white">{formatDate(patient.date_of_birth)}</p>
          </div>
        )}

        {/* Device Assignment */}
        {patient.current_device_id && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Assigned Device</p>
            <p className="text-sm text-accent-cyan font-mono">{patient.current_device_id}</p>
          </div>
        )}

        {/* Last Activity */}
        {patient.last_session_timestamp && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Last Activity</p>
            <p className="text-sm text-white">{formatTime(patient.last_session_timestamp)}</p>
          </div>
        )}

        {/* Patient ID */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Patient ID</p>
          <p className="text-sm text-white font-mono truncate">{patient.user_id.slice(0, 12)}...</p>
        </div>
      </div>

      {/* Medical History */}
      {patient.medical_history && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-gray-400 mb-2">Medical History</p>
          <div className="flex flex-wrap gap-2">
            {patient.medical_history.conditions && patient.medical_history.conditions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {patient.medical_history.conditions.map((condition, idx) => (
                  <span key={idx} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30">
                    {condition}
                  </span>
                ))}
              </div>
            )}
            {patient.medical_history.medications && patient.medical_history.medications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {patient.medical_history.medications.map((medication, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                    {medication}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      {patient.emergency_contact && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-gray-400 mb-2">Emergency Contact</p>
          <div className="text-sm text-white">
            <p className="font-semibold">{patient.emergency_contact.name} ({patient.emergency_contact.relationship})</p>
            <p className="text-gray-300">{patient.emergency_contact.phone}</p>
          </div>
        </div>
      )}
    </div>
  );
}
