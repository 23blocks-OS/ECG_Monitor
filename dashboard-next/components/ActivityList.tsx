'use client';

import React from 'react';
import type { Activity } from '@/types/activity';

interface ActivityListProps {
  activities: Activity[];
  onSelectActivity?: (activity: Activity) => void;
  selectedActivityId?: string;
}

export default function ActivityList({ activities, onSelectActivity, selectedActivityId }: ActivityListProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return 'N/A';
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  };

  const getActivityIcon = (type?: string) => {
    const icons: Record<string, string> = {
      running: '🏃',
      cycling: '🚴',
      swimming: '🏊',
      walking: '🚶',
      hiking: '⛰️',
      unknown: '📊'
    };
    return icons[type || 'unknown'] || icons.unknown;
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-500">No activities uploaded yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Upload your Garmin or Strava files to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.activity_id}
          onClick={() => onSelectActivity?.(activity)}
          className={`bg-white p-4 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg ${
            selectedActivityId === activity.activity_id ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                <div>
                  <h3 className="font-semibold text-lg">
                    {activity.activity_name || `${activity.activity_type || 'Activity'}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(activity.start_timestamp)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-semibold">{formatDuration(activity.duration_seconds)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="font-semibold">{formatDistance(activity.total_distance_meters)}</p>
                </div>

                {activity.avg_heart_rate && (
                  <div>
                    <p className="text-xs text-gray-500">Avg HR</p>
                    <p className="font-semibold">{activity.avg_heart_rate} bpm</p>
                  </div>
                )}

                {activity.calories && (
                  <div>
                    <p className="text-xs text-gray-500">Calories</p>
                    <p className="font-semibold">{activity.calories} kcal</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activity.source === 'garmin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {activity.source}
                </span>

                {activity.has_ecg_match && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                    ✓ Matched with ECG ({activity.ecg_match_count})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
