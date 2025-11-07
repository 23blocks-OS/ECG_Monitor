import type {
  Activity,
  ActivityUpload,
  ActivityECGMatch,
  GetActivitiesRequest,
  GetActivitiesResponse,
  CreateMatchRequest,
  GetMatchesResponse
} from '@/types/activity';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function getActivities(request: GetActivitiesRequest): Promise<GetActivitiesResponse> {
  try {
    const params = new URLSearchParams({
      user_id: request.user_id,
    });

    if (request.start) params.append('start', request.start.toString());
    if (request.end) params.append('end', request.end.toString());
    if (request.source) params.append('source', request.source);
    if (request.limit) params.append('limit', request.limit.toString());

    const response = await fetch(`${API_BASE_URL}/api/activities?${params}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
}

export async function getActivity(activityId: string): Promise<Activity> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching activity:', error);
    throw error;
  }
}

export async function createMatch(request: CreateMatchRequest): Promise<ActivityECGMatch> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/activities/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
}

export async function getMatches(userId: string, activityId?: string, sessionId?: string): Promise<GetMatchesResponse> {
  try {
    const params = new URLSearchParams({ user_id: userId });
    if (activityId) params.append('activity_id', activityId);
    if (sessionId) params.append('session_id', sessionId);

    const response = await fetch(`${API_BASE_URL}/api/activities/matches?${params}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
}
