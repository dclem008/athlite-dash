export interface AthleteHealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
}

export type Role = 'athlete' | 'coach';

export interface User {
  id: string;
  role: Role;
  firstName: string;
  lastName: string;
}

export interface MetricDefinition {
  id: string;
  template_id: string;
  key: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'enum';
  category: 'game' | 'lifting' | 'health' | 'drills';
  is_required: boolean;
  options: string[] | null;
}

export interface SportTemplate {
  id: string;
  name: string;
  metric_definitions: MetricDefinition[]; // Nested relational data
}

export interface GetTemplatesResponse {
  data: SportTemplate[];
}

export interface CreateEventRequest {
  user_id: string;
  template_id: string;
  type: 'game' | 'workout' | 'health_log';
  recorded_at: string; // ISO-8601 string
  payload: Record<string, any>; // The dynamic JSONB data
}

export interface EventRecord {
  id: string;
  recorded_at: string;
  payload: Record<string, any>; // The dynamic JSONB data (e.g., points, rebounds)
}

export interface GetAnalyticsResponse {
  data: EventRecord[];
}

export interface HealthWebhookPayload {
  provider: 'whoop' | 'oura' | 'google_health';
  user_id: string; // In production, providers send their own ID, and we map it to ours in the DB. For this architecture phase, we will assume they pass our ID.
  timestamp: string; // ISO-8601
  metrics: {
    hrv?: number;
    rhr?: number;
    sleep_score?: number;
  };
}

export interface GoalRecord {
  id: string;
  template_id: string;
  metric_key: string;
  target_value: number;
  deadline: string;
}

export interface CreateGoalRequest {
  template_id: string;
  metric_key: string;
  target_value: number;
  deadline: string; // ISO-8601 string
}

export interface GetGoalsResponse {
  data: GoalRecord[];
}

export interface UserProfile {
  id: string;
  role: 'athlete' | 'coach';
  first_name: string;
  last_name: string;
}

export interface GetAthletesResponse {
  data: UserProfile[]; // A list of athletes the coach manages
}