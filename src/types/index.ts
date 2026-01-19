export interface Person {
  id: string;
  name: string;
  timezone: string;
  currentTime: string;
  currentDate: string;
}

export interface User {
  id: string;
  email: string;
  timezone: string;
  language: string;
  time_format?: '12h' | '24h';
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  timezone: string;
  location?: string;
  notes?: string;
  working_hours_start?: number;
  working_hours_end?: number;
  group_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactGroup {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface ContactAvailability {
  timezone: string;
  workingHours: TimeRange;
  sleepingHours: TimeRange;
}

export interface TimeFormat extends Intl.DateTimeFormatOptions {
  timeZone: string;
  hour12: boolean;
}

export interface DateFormat extends Intl.DateTimeFormatOptions {
  timeZone: string;
  hour12: boolean;
}

export interface UserPreferences {
  timeFormat: '12h' | '24h';
  language: string;
  timezone: string;
}

export interface MeetingTimeSlot {
  hour: number;
  score: number;
  allWorking: boolean;
  participants: {
    id: string;
    name: string;
    localHour: number;
    status: 'working' | 'free' | 'sleeping';
  }[];
}

// ============================================
// TEAMS & WORKSPACES
// ============================================

export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  description?: string;
  logo_url?: string;
  settings: TeamSettings;
  created_at: string;
  updated_at: string;
}

export interface TeamSettings {
  default_timezone?: string;
  allow_member_invites?: boolean;
  require_calendar_sync?: boolean;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_email?: string;
  invited_at?: string;
  joined_at: string;
  created_at: string;
  // Joined data
  user?: User;
  profile?: User;
}

// ============================================
// CALENDAR INTEGRATIONS
// ============================================

export type CalendarProvider = 'google' | 'microsoft' | 'apple';

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  provider_account_id?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  calendar_id?: string;
  calendar_name?: string;
  is_primary: boolean;
  sync_enabled: boolean;
  last_synced_at?: string;
  settings: CalendarConnectionSettings;
  created_at: string;
  updated_at: string;
}

export interface CalendarConnectionSettings {
  sync_direction?: 'one_way' | 'two_way';
  sync_interval_minutes?: number;
  include_private_events?: boolean;
}

export interface ExternalCalendar {
  id: string;
  name: string;
  color?: string;
  is_primary: boolean;
  access_role: 'owner' | 'writer' | 'reader';
}

// ============================================
// EVENTS
// ============================================

export interface CalendarEvent {
  id: string;
  user_id: string;
  team_id?: string;
  external_id?: string;
  external_provider?: CalendarProvider;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  timezone: string;
  is_all_day: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'default' | 'public' | 'private';
  busy_status: 'free' | 'busy' | 'tentative' | 'out_of_office';
  recurrence_rule?: string;
  conference_url?: string;
  conference_provider?: string;
  attendees: EventAttendee[];
  reminders: EventReminder[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  email: string;
  name?: string;
  response_status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  is_organizer?: boolean;
  is_optional?: boolean;
}

export interface EventReminder {
  method: 'email' | 'popup' | 'sms';
  minutes_before: number;
}

export interface FreeBusySlot {
  start: string;
  end: string;
  status: 'busy' | 'tentative' | 'out_of_office';
  title?: string;
}

// ============================================
// BOOKING LINKS (Calendly-style)
// ============================================

export interface BookingLink {
  id: string;
  user_id: string;
  team_id?: string;
  slug: string;
  title: string;
  description?: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_notice_hours: number;
  max_days_ahead: number;
  timezone: string;
  location_type: 'video' | 'phone' | 'in_person' | 'custom';
  location_value?: string;
  color: string;
  is_active: boolean;
  requires_confirmation: boolean;
  collect_payment: boolean;
  payment_amount?: number;
  payment_currency: string;
  questions: BookingQuestion[];
  availability_schedule: AvailabilityScheduleData;
  created_at: string;
  updated_at: string;
}

export interface BookingQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'phone';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface Booking {
  id: string;
  booking_link_id: string;
  host_user_id: string;
  event_id?: string;
  invitee_name: string;
  invitee_email: string;
  invitee_timezone: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  cancellation_reason?: string;
  cancelled_by?: 'host' | 'invitee';
  cancelled_at?: string;
  notes?: string;
  answers: Record<string, string>;
  meeting_url?: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  booking_link?: BookingLink;
  host?: User;
}

export interface AvailableSlot {
  start: string;
  end: string;
  timezone: string;
}

// ============================================
// MEETING POLLS (Doodle-style)
// ============================================

export interface MeetingPoll {
  id: string;
  user_id: string;
  team_id?: string;
  slug: string;
  title: string;
  description?: string;
  location?: string;
  duration_minutes: number;
  timezone: string;
  deadline?: string;
  is_anonymous: boolean;
  allow_comments: boolean;
  allow_maybe: boolean;
  limit_per_option?: number;
  auto_confirm: boolean;
  status: 'draft' | 'open' | 'closed' | 'confirmed';
  confirmed_option_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  options?: PollOption[];
  votes?: PollVote[];
  creator?: User;
}

export interface PollOption {
  id: string;
  poll_id: string;
  start_time: string;
  end_time: string;
  vote_count: number;
  maybe_count: number;
  created_at: string;
  // Joined data
  votes?: PollVote[];
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id?: string;
  participant_name: string;
  participant_email?: string;
  vote: 'yes' | 'no' | 'maybe';
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface PollParticipant {
  name: string;
  email?: string;
  votes: Record<string, 'yes' | 'no' | 'maybe'>;
  comment?: string;
}

// ============================================
// AVAILABILITY SCHEDULES
// ============================================

export interface AvailabilitySchedule {
  id: string;
  user_id: string;
  name: string;
  timezone: string;
  is_default: boolean;
  schedule: AvailabilityScheduleData;
  overrides: AvailabilityOverride[];
  created_at: string;
  updated_at: string;
}

export interface AvailabilityScheduleData {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export interface AvailabilityOverride {
  date: string; // YYYY-MM-DD
  available: boolean;
  slots?: TimeSlot[];
  reason?: string;
}

// ============================================
// AI SUGGESTIONS
// ============================================

export interface MeetingSuggestion {
  start_time: string;
  end_time: string;
  score: number;
  reason: string;
  participant_availability: ParticipantAvailability[];
}

export interface ParticipantAvailability {
  user_id?: string;
  contact_id?: string;
  name: string;
  timezone: string;
  local_time: string;
  status: 'available' | 'busy' | 'outside_hours' | 'unknown';
  conflicts?: string[];
}

export interface MeetingRequest {
  title: string;
  duration_minutes: number;
  participants: string[]; // user_ids or contact_ids
  preferred_times?: TimeRange[];
  avoid_times?: TimeRange[];
  date_range: {
    start: string;
    end: string;
  };
  constraints?: MeetingConstraints;
}

export interface MeetingConstraints {
  respect_working_hours: boolean;
  minimize_timezone_impact: boolean;
  prefer_morning?: boolean;
  prefer_afternoon?: boolean;
  avoid_lunch_hours?: boolean;
  max_suggestions?: number;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// ============================================
// OAUTH
// ============================================

export interface OAuthState {
  provider: CalendarProvider;
  redirect_url: string;
  user_id: string;
  timestamp: number;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}
