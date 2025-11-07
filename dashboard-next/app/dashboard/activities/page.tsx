'use client';

import React, { useState, useEffect } from 'react';
import ActivityUpload from '@/components/ActivityUpload';
import ActivityList from '@/components/ActivityList';
import { getActivities } from '@/lib/activityApi';
import type { Activity } from '@/types/activity';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // TODO: Get actual user ID from auth context
  const userId = 'demo-user-001';

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await getActivities({ user_id: userId, limit: 50 });
      setActivities(response.activities);
      setError(null);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();

    // Poll for updates every 30 seconds to catch processing status changes
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadComplete = (uploadId: string) => {
    console.log('Upload complete:', uploadId);
    // Reload activities after a short delay to allow processing
    setTimeout(() => {
      loadActivities();
    }, 2000);
  };

  const handleUploadError = (error: string) => {
    setError(error);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Exercise Activities
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload section */}
          <div className="lg:col-span-1">
            <ActivityUpload
              userId={userId}
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
            />

            {/* Quick stats */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Activities</span>
                  <span className="font-semibold">{activities.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Matched with ECG</span>
                  <span className="font-semibold">
                    {activities.filter(a => a.has_ecg_match).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Garmin</span>
                  <span className="font-semibold">
                    {activities.filter(a => a.source === 'garmin').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Strava</span>
                  <span className="font-semibold">
                    {activities.filter(a => a.source === 'strava').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activities list */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Activities</h2>
              <button
                onClick={loadActivities}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loading && activities.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-500">Loading activities...</p>
              </div>
            ) : (
              <ActivityList
                activities={activities}
                onSelectActivity={setSelectedActivity}
                selectedActivityId={selectedActivity?.activity_id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
