'use client';

import React, { useEffect } from 'react';
import type { Activity, ActivityECGMatch } from '@/types/activity';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';

interface ActivityMapInternalProps {
  activity: Activity;
  ecgMatches?: ActivityECGMatch[];
  showECGOverlay?: boolean;
  showHeartRateColors?: boolean;
  showElevationProfile?: boolean;
}

// Component to fit map bounds to the route
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = positions.reduce(
        (bounds, coord) => bounds.extend(coord),
        new (window as any).L.LatLngBounds(positions[0], positions[0])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);

  return null;
}

export default function ActivityMapInternal({
  activity,
  ecgMatches = [],
  showECGOverlay = false,
  showHeartRateColors = true,
  showElevationProfile = false,
}: ActivityMapInternalProps) {
  // Extract GPS positions from time series
  const positions = activity.time_series?.positions || [];
  const heartRates = activity.time_series?.heart_rates || [];
  const timestamps = activity.time_series?.timestamps || [];

  if (positions.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <p className="text-gray-700 font-semibold mb-2">No GPS data available</p>
          <p className="text-gray-500 text-sm">
            This activity doesn&apos;t contain GPS tracking information.
          </p>
        </div>
      </div>
    );
  }

  // Convert GPS positions to Leaflet format [lat, lng]
  const routeCoordinates: [number, number][] = positions.map(pos => [pos.lat, pos.lon]);

  // Calculate center point
  const centerLat = positions.reduce((sum, pos) => sum + pos.lat, 0) / positions.length;
  const centerLon = positions.reduce((sum, pos) => sum + pos.lon, 0) / positions.length;

  // Get heart rate color for a given HR value
  const getHeartRateColor = (hr: number): string => {
    if (!activity.max_heart_rate) return '#3B82F6'; // default blue

    const maxHR = activity.max_heart_rate;
    const percentage = (hr / maxHR) * 100;

    if (percentage < 60) return '#10B981'; // green - easy
    if (percentage < 70) return '#3B82F6'; // blue - moderate
    if (percentage < 80) return '#F59E0B'; // yellow - hard
    if (percentage < 90) return '#F97316'; // orange - very hard
    return '#EF4444'; // red - max effort
  };

  // Create segments with heart rate colors if available
  const createColoredSegments = () => {
    if (!showHeartRateColors || heartRates.length === 0) {
      return [
        {
          positions: routeCoordinates,
          color: '#3B82F6',
          weight: 4,
          isECG: false,
        }
      ];
    }

    const segments = [];
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const hr = heartRates[i] || 0;
      const timestamp = timestamps[i] || 0;

      // Check if this point is within any ECG match period
      const isInECGPeriod = showECGOverlay && ecgMatches.some(
        match => timestamp >= match.overlap_start && timestamp <= match.overlap_end
      );

      segments.push({
        positions: [routeCoordinates[i], routeCoordinates[i + 1]],
        color: getHeartRateColor(hr),
        weight: isInECGPeriod ? 6 : 4,
        isECG: isInECGPeriod,
      });
    }
    return segments;
  };

  const segments = createColoredSegments();

  // Create ECG overlay segments for highlighting
  const createECGOverlaySegments = () => {
    if (!showECGOverlay || ecgMatches.length === 0 || timestamps.length === 0) {
      return [];
    }

    const overlaySegments = [];

    for (const match of ecgMatches) {
      const matchPositions = [];

      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        if (timestamp >= match.overlap_start && timestamp <= match.overlap_end) {
          matchPositions.push(routeCoordinates[i]);
        }
      }

      if (matchPositions.length > 0) {
        overlaySegments.push({
          positions: matchPositions,
          match: match,
        });
      }
    }

    return overlaySegments;
  };

  const ecgOverlaySegments = createECGOverlaySegments();

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Format distance
  const formatDistance = (meters?: number) => {
    if (!meters) return 'N/A';
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Activity info header */}
      <div className="bg-white p-4 rounded-t-lg border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {activity.activity_name || 'Activity'}
            </h3>
            <p className="text-sm text-gray-500">{activity.activity_type || 'Unknown'}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {new Date(activity.start_timestamp * 1000).toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(activity.start_timestamp * 1000).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Distance</div>
            <div className="text-sm font-semibold">{formatDistance(activity.total_distance_meters)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Duration</div>
            <div className="text-sm font-semibold">{formatDuration(activity.duration_seconds)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Avg HR</div>
            <div className="text-sm font-semibold">{activity.avg_heart_rate || 'N/A'} bpm</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Max HR</div>
            <div className="text-sm font-semibold">{activity.max_heart_rate || 'N/A'} bpm</div>
          </div>
        </div>

        {/* ECG match indicator */}
        {ecgMatches.length > 0 && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
            <span className="text-green-700 font-semibold">
              ✓ {ecgMatches.length} ECG session{ecgMatches.length > 1 ? 's' : ''} matched
            </span>
          </div>
        )}
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <MapContainer
          center={[centerLat, centerLon]}
          zoom={13}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds positions={routeCoordinates} />

          {/* Route segments with heart rate colors */}
          {segments.map((segment, idx) => (
            <Polyline
              key={idx}
              positions={segment.positions}
              pathOptions={{
                color: segment.color,
                weight: segment.weight,
                opacity: 0.8,
              }}
            />
          ))}

          {/* ECG overlay segments - highlighted with thicker line */}
          {ecgOverlaySegments.map((overlaySegment, idx) => (
            <Polyline
              key={`ecg-${idx}`}
              positions={overlaySegment.positions}
              pathOptions={{
                color: '#8B5CF6',
                weight: 8,
                opacity: 0.6,
                dashArray: '10, 10',
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-purple-700">ECG Session</div>
                  <div className="text-xs text-gray-600 mt-1">
                    <div>Quality Score: {overlaySegment.match.match_quality}/100</div>
                    {overlaySegment.match.hr_correlation && (
                      <div>HR Correlation: {(overlaySegment.match.hr_correlation * 100).toFixed(1)}%</div>
                    )}
                    <div>Duration: {formatDuration(overlaySegment.match.overlap_duration)}</div>
                  </div>
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Start marker */}
          {positions.length > 0 && (
            <Marker position={[positions[0].lat, positions[0].lon]}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">Start</div>
                  <div className="text-xs text-gray-600">
                    {new Date(activity.start_timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* End marker */}
          {positions.length > 1 && (
            <Marker position={[positions[positions.length - 1].lat, positions[positions.length - 1].lon]}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">Finish</div>
                  <div className="text-xs text-gray-600">
                    {new Date(activity.end_timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      {(showHeartRateColors && heartRates.length > 0) || (showECGOverlay && ecgOverlaySegments.length > 0) ? (
        <div className="bg-white p-4 rounded-b-lg border-t">
          {showHeartRateColors && heartRates.length > 0 && (
            <>
              <div className="text-xs text-gray-600 mb-2">Heart Rate Zones:</div>
              <div className="flex gap-4 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
                  <span className="text-xs">Easy (&lt;60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
                  <span className="text-xs">Moderate (60-70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
                  <span className="text-xs">Hard (70-80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F97316' }}></div>
                  <span className="text-xs">Very Hard (80-90%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
                  <span className="text-xs">Max (&gt;90%)</span>
                </div>
              </div>
            </>
          )}

          {showECGOverlay && ecgOverlaySegments.length > 0 && (
            <>
              <div className="text-xs text-gray-600 mb-2">ECG Data:</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded" style={{
                  backgroundColor: '#8B5CF6',
                  backgroundImage: 'repeating-linear-gradient(to right, #8B5CF6 0px, #8B5CF6 5px, transparent 5px, transparent 10px)'
                }}></div>
                <span className="text-xs text-purple-700 font-semibold">ECG Session Period</span>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
