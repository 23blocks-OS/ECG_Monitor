'use client';

import React, { useState, useEffect } from 'react';
import ActivityUpload from '@/components/ActivityUpload';
import ActivityList from '@/components/ActivityList';
import { getActivities } from '@/lib/activityApi';
import type { Activity } from '@/types/activity';
import Link from 'next/link';
import AIChatSidebar from '@/components/AIChatSidebar';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Exercise Activities
          </h1>
          <Link
            href="/dashboard/activity-map"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View Map
          </Link>
        </div>

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

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={{
          patientInfo: {
            userId: userId,
          },
        }}
      />

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-30"
        title="Ask AI Assistant"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  );
}
