'use client';

import React, { useState, useEffect } from 'react';
import type { Activity, ActivityECGMatch } from '@/types/activity';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues with Leaflet
const ActivityMapInternal = dynamic(
  () => import('./ActivityMapInternal'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

interface ActivityMapProps {
  activity: Activity;
  ecgMatches?: ActivityECGMatch[];
  showECGOverlay?: boolean;
  showHeartRateColors?: boolean;
  showElevationProfile?: boolean;
}

export default function ActivityMap(props: ActivityMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return <ActivityMapInternal {...props} />;
}
