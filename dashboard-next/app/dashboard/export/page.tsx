'use client';

import React, { useState } from 'react';
import { exportData } from '@/lib/api';
import type { ExportParams } from '@/types';

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [deviceId, setDeviceId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  // TODO: Get actual user ID from auth context
  const userId = 'demo-user-001';

  // Set default date range (last 7 days)
  React.useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    setEndDate(end.toISOString().slice(0, 16));
    setStartDate(start.toISOString().slice(0, 16));
  }, []);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate dates
      if (!startDate || !endDate) {
        throw new Error('Please select both start and end dates');
      }

      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();

      if (startTime >= endTime) {
        throw new Error('Start date must be before end date');
      }

      // Prepare export parameters
      const params: ExportParams = {
        userId,
        startTime,
        endTime,
        format,
      };

      if (deviceId.trim()) {
        params.deviceId = deviceId.trim();
      }

      // Call export API
      const blob = await exportData(params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecg_export_${userId}_${startTime}_${endTime}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`Successfully exported data as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Export ECG Data</h1>
        <p className="text-gray-600 mb-8">
          Export your ECG data for a selected time period to share with your doctor or upload to other platforms.
        </p>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleExport} className="space-y-6">
            {/* Device ID (optional) */}
            <div>
              <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-2">
                Device ID (optional)
              </label>
              <input
                type="text"
                id="deviceId"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g., ecg-device-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to export data from all your devices
              </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Quick Date Range Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setHours(start.getHours() - 24);
                    setStartDate(start.toISOString().slice(0, 16));
                    setEndDate(end.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition"
                >
                  Last 24 Hours
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - 7);
                    setStartDate(start.toISOString().slice(0, 16));
                    setEndDate(end.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - 30);
                    setStartDate(start.toISOString().slice(0, 16));
                    setEndDate(end.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition"
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={format === 'json'}
                    onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    JSON (includes raw waveform data)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    CSV (summary data, no waveforms)
                  </span>
                </label>
              </div>
            </div>

            {/* Export Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Export Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your export will include ECG sessions, analysis data, and alerts</li>
                <li>• JSON format includes raw waveform data from all channels</li>
                <li>• CSV format is better for spreadsheet analysis</li>
                <li>• All timestamps are in UTC</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              {loading ? 'Exporting...' : 'Export Data'}
            </button>
          </form>
        </div>

        {/* Back to Dashboard Link */}
        <div className="mt-6 text-center">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
