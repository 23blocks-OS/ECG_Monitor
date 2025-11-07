// Type definitions for Garmin/Strava activity data integration

export type ActivitySource = 'garmin' | 'strava';
export type FileType = 'fit' | 'gpx' | 'tcx' | 'json';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type MatchType = 'automatic' | 'manual';

export interface ActivityUpload {
  upload_id: string;
  user_id: string;
  upload_timestamp: number;
  source: ActivitySource;
  file_name: string;
  file_type: FileType;
  file_size: number;
  s3_key: string;
  s3_bucket: string;
  processing_status: ProcessingStatus;
  activities_count?: number;
  error_message?: string;
  ttl?: number;
}

export interface GPSPosition {
  lat: number;
  lon: number;
}

export interface HeartRateZones {
  zone1?: number; // % time in zone 1 (50-60% max HR)
  zone2?: number; // % time in zone 2 (60-70% max HR)
  zone3?: number; // % time in zone 3 (70-80% max HR)
  zone4?: number; // % time in zone 4 (80-90% max HR)
  zone5?: number; // % time in zone 5 (90-100% max HR)
}

export interface ActivityTimeSeries {
  timestamps: number[];          // Unix timestamps
  heart_rates?: number[];        // BPM
  distances?: number[];          // Meters
  speeds?: number[];             // m/s
  elevations?: number[];         // Meters
  cadences?: number[];           // steps/min or RPM
  powers?: number[];             // Watts
  positions?: GPSPosition[];     // GPS coordinates
}

export interface Activity {
  activity_id: string;
  user_id: string;
  upload_id: string;
  source: ActivitySource;

  // Activity metadata
  activity_name?: string;
  activity_type?: string;        // running, cycling, swimming, etc.
  start_timestamp: number;
  end_timestamp: number;
  duration_seconds: number;

  // GPS data summary
  total_distance_meters?: number;
  start_lat?: number;
  start_lon?: number;
  end_lat?: number;
  end_lon?: number;

  // Heart rate data
  avg_heart_rate?: number;
  max_heart_rate?: number;
  min_heart_rate?: number;
  heart_rate_zones?: HeartRateZones;

  // Other metrics
  avg_speed?: number;            // m/s
  max_speed?: number;
  avg_cadence?: number;
  avg_power?: number;            // watts
  elevation_gain?: number;       // meters
  elevation_loss?: number;
  calories?: number;

  // Detailed time-series data
  time_series?: ActivityTimeSeries;

  // Matching status
  has_ecg_match: boolean;
  ecg_match_count: number;

  ttl?: number;
}

export interface ActivityECGMatch {
  match_id: string;
  activity_id: string;
  session_id: string;
  user_id: string;

  // Match metadata
  match_timestamp: number;
  match_type: MatchType;
  match_quality: number;         // 0-100 score

  // Overlap analysis
  overlap_start: number;
  overlap_end: number;
  overlap_duration: number;      // seconds

  // Correlation metrics
  hr_correlation?: number;       // -1 to 1
  avg_hr_diff?: number;
  max_hr_diff?: number;

  // Notes
  notes?: string;
  verified: boolean;
}

// API Request/Response types

export interface UploadActivityRequest {
  file: File;
  source: ActivitySource;
}

export interface UploadActivityResponse {
  upload_id: string;
  status: ProcessingStatus;
  s3_url: string;
}

export interface GetActivitiesRequest {
  user_id: string;
  start?: number;
  end?: number;
  source?: ActivitySource;
  limit?: number;
}

export interface GetActivitiesResponse {
  activities: Activity[];
  count: number;
}

export interface CreateMatchRequest {
  activity_id: string;
  session_id: string;
  match_type: MatchType;
  notes?: string;
}

export interface GetMatchesRequest {
  user_id: string;
  activity_id?: string;
  session_id?: string;
}

export interface GetMatchesResponse {
  matches: ActivityECGMatch[];
  count: number;
}

// UI Component types

export interface ActivityListItemProps {
  activity: Activity;
  onSelect?: (activity: Activity) => void;
  selected?: boolean;
}

export interface ActivityUploadWidgetProps {
  onUploadComplete?: (upload: ActivityUpload) => void;
  onError?: (error: string) => void;
}

export interface ActivityMatchViewProps {
  match: ActivityECGMatch;
  activity: Activity;
  ecgSession: any; // ECG session type from existing types
}

export interface ActivityTimelineProps {
  activities: Activity[];
  ecgSessions: any[];
  matches: ActivityECGMatch[];
  onCreateMatch?: (activityId: string, sessionId: string) => void;
}
