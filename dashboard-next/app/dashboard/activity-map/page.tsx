'use client';

import React, { useState, useEffect } from 'react';
import ActivityMap from '@/components/ActivityMap';
import { getActivities, getMatches } from '@/lib/activityApi';
import type { Activity, ActivityECGMatch } from '@/types/activity';
import Link from 'next/link';

export default function ActivityMapPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [ecgMatches, setEcgMatches] = useState<ActivityECGMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHRColors, setShowHRColors] = useState(true);
  const [showECGOverlay, setShowECGOverlay] = useState(true);

  // TODO: Get actual user ID from auth context
  const userId = 'demo-user-001';

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await getActivities({ user_id: userId, limit: 50 });

      // Filter to only activities with GPS data
      const activitiesWithGPS = response.activities.filter(
        a => a.time_series?.positions && a.time_series.positions.length > 0
      );

      setActivities(activitiesWithGPS);

      // Auto-select first activity if none selected
      if (!selectedActivity && activitiesWithGPS.length > 0) {
        setSelectedActivity(activitiesWithGPS[0]);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (activityId: string) => {
    try {
      const response = await getMatches(userId, activityId);
      setEcgMatches(response.matches);
    } catch (err) {
      console.error('Failed to load ECG matches:', err);
      setEcgMatches([]);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    if (selectedActivity) {
      loadMatches(selectedActivity.activity_id);
    }
  }, [selectedActivity]);

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return 'N/A';
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Map Tracker</h1>
              <p className="text-gray-600 mt-1">
                Visualize your activities with GPS tracking and ECG correlation
              </p>
            </div>
            <Link
              href="/dashboard/activities"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              ← Back to Activities
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Activity selector sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Select Activity</h2>

              {loading ? (
                <p className="text-gray-500 text-sm">Loading activities...</p>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-700 font-semibold mb-2">No GPS activities found</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Upload activities with GPS data to view them on the map.
                  </p>
                  <Link
                    href="/dashboard/activities"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Upload Activity
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {activities.map((activity) => (
                    <button
                      key={activity.activity_id}
                      onClick={() => handleActivitySelect(activity)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedActivity?.activity_id === activity.activity_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {activity.activity_name || 'Unnamed Activity'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {activity.activity_type || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(activity.start_timestamp * 1000).toLocaleDateString()}
                          </div>
                        </div>
                        {activity.has_ecg_match && (
                          <span className="ml-2 text-green-600 text-xs">✓</span>
                        )}
                      </div>
                      <div className="mt-2 flex gap-2 text-xs">
                        <span className="text-gray-600">
                          {formatDistance(activity.total_distance_meters)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          {formatDuration(activity.duration_seconds)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Controls */}
              {selectedActivity && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Display Options</h3>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHRColors}
                      onChange={(e) => setShowHRColors(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Heart Rate Colors</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showECGOverlay}
                      onChange={(e) => setShowECGOverlay(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={ecgMatches.length === 0}
                    />
                    <span className={`text-sm ${ecgMatches.length === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                      ECG Overlay
                    </span>
                  </label>

                  {ecgMatches.length > 0 && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                      {ecgMatches.length} ECG match{ecgMatches.length > 1 ? 'es' : ''} available
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">About Map View</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• View GPS tracks from your activities</li>
                <li>• Color-coded by heart rate zones</li>
                <li>• See ECG correlations on the map</li>
                <li>• Click markers for details</li>
              </ul>
            </div>
          </div>

          {/* Map display */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
              {selectedActivity ? (
                <ActivityMap
                  activity={selectedActivity}
                  ecgMatches={ecgMatches}
                  showECGOverlay={showECGOverlay}
                  showHeartRateColors={showHRColors}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <p className="text-gray-700 font-semibold mb-2">No activity selected</p>
                    <p className="text-gray-500 text-sm">
                      Select an activity from the list to view it on the map.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
