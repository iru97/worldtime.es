import { supabase } from '@/lib/supabase';
import { BaseApiService, ApiErrorCodes } from './BaseApiService';
import { logger } from '@/services/LoggingService';
import type {
  ApiResponse,
  CalendarConnection,
  ExternalCalendar,
  CalendarEvent,
  FreeBusySlot,
  OAuthTokens,
} from '@/types';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
].join(' ');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  status?: string;
  transparency?: string;
  visibility?: string;
  recurrence?: string[];
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { uri?: string; entryPointType?: string }[] };
  attendees?: { email: string; displayName?: string; responseStatus?: string; organizer?: boolean; optional?: boolean }[];
  reminders?: { useDefault: boolean; overrides?: { method: string; minutes: number }[] };
}

interface GoogleCalendarList {
  items: {
    id: string;
    summary: string;
    backgroundColor?: string;
    primary?: boolean;
    accessRole: string;
  }[];
}

interface GoogleFreeBusyResponse {
  calendars: {
    [key: string]: {
      busy: { start: string; end: string }[];
      errors?: { domain: string; reason: string }[];
    };
  };
}

export class GoogleCalendarService extends BaseApiService {
  constructor() {
    super('calendar_connections');
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: GOOGLE_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<ApiResponse<OAuthTokens>> {
    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: GOOGLE_REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Google token exchange failed:', error);
        return {
          success: false,
          error: {
            code: ApiErrorCodes.EXTERNAL_API_ERROR,
            message: error.error_description || 'Failed to exchange code for tokens',
          },
        };
      }

      const tokens = await response.json();
      return {
        success: true,
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          token_type: tokens.token_type,
          scope: tokens.scope,
        },
      };
    } catch (err) {
      const error = err as Error;
      logger.error('Google token exchange exception:', error);
      return {
        success: false,
        error: {
          code: 'EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<ApiResponse<OAuthTokens>> {
    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Google token refresh failed:', error);
        return {
          success: false,
          error: {
            code: ApiErrorCodes.TOKEN_EXPIRED,
            message: error.error_description || 'Failed to refresh token',
          },
        };
      }

      const tokens = await response.json();
      return {
        success: true,
        data: {
          access_token: tokens.access_token,
          refresh_token: refreshToken, // Google doesn't return new refresh token
          expires_in: tokens.expires_in,
          token_type: tokens.token_type,
          scope: tokens.scope,
        },
      };
    } catch (err) {
      const error = err as Error;
      logger.error('Google token refresh exception:', error);
      return {
        success: false,
        error: {
          code: 'EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * Save calendar connection after successful OAuth
   */
  async saveConnection(
    tokens: OAuthTokens,
    providerAccountId: string,
    calendarId?: string,
    calendarName?: string
  ): Promise<ApiResponse<CalendarConnection>> {
    const userId = await this.requireUserId();

    const connectionData = {
      user_id: userId,
      provider: 'google' as const,
      provider_account_id: providerAccountId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      calendar_id: calendarId || 'primary',
      calendar_name: calendarName || 'Primary Calendar',
      is_primary: true,
      sync_enabled: true,
    };

    // Upsert connection (update if exists)
    return this.handleResponse(
      supabase
        .from('calendar_connections')
        .upsert(connectionData, { onConflict: 'user_id,provider,provider_account_id' })
        .select()
        .single()
    );
  }

  /**
   * Get user's calendar connection
   */
  async getConnection(): Promise<ApiResponse<CalendarConnection | null>> {
    const userId = await this.getUserId();
    if (!userId) {
      return { success: true, data: null };
    }

    return this.handleResponse(
      supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single()
    );
  }

  /**
   * Get valid access token (refreshing if necessary)
   */
  async getValidAccessToken(connection: CalendarConnection): Promise<ApiResponse<string>> {
    const expiresAt = new Date(connection.token_expires_at || 0);
    const now = new Date();

    // If token expires in less than 5 minutes, refresh it
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      if (!connection.refresh_token) {
        return {
          success: false,
          error: {
            code: ApiErrorCodes.TOKEN_EXPIRED,
            message: 'No refresh token available',
          },
        };
      }

      const refreshResult = await this.refreshAccessToken(connection.refresh_token);
      if (!refreshResult.success || !refreshResult.data) {
        return refreshResult as ApiResponse<string>;
      }

      // Update stored tokens
      await supabase
        .from('calendar_connections')
        .update({
          access_token: refreshResult.data.access_token,
          token_expires_at: new Date(Date.now() + refreshResult.data.expires_in * 1000).toISOString(),
        })
        .eq('id', connection.id);

      return { success: true, data: refreshResult.data.access_token };
    }

    return { success: true, data: connection.access_token };
  }

  /**
   * Make authenticated request to Google Calendar API
   */
  private async googleApiRequest<T>(
    connection: CalendarConnection,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const tokenResult = await this.getValidAccessToken(connection);
    if (!tokenResult.success || !tokenResult.data) {
      return tokenResult as ApiResponse<T>;
    }

    try {
      const response = await fetch(`${GOOGLE_CALENDAR_API}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${tokenResult.data}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Google API request failed:', { endpoint, error });
        return {
          success: false,
          error: {
            code: ApiErrorCodes.EXTERNAL_API_ERROR,
            message: error.error?.message || 'Google API request failed',
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const error = err as Error;
      logger.error('Google API request exception:', error);
      return {
        success: false,
        error: {
          code: 'EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * List user's calendars
   */
  async listCalendars(connection: CalendarConnection): Promise<ApiResponse<ExternalCalendar[]>> {
    const result = await this.googleApiRequest<GoogleCalendarList>(connection, '/users/me/calendarList');

    if (!result.success || !result.data) {
      return result as ApiResponse<ExternalCalendar[]>;
    }

    const calendars: ExternalCalendar[] = result.data.items.map((cal) => ({
      id: cal.id,
      name: cal.summary,
      color: cal.backgroundColor,
      is_primary: cal.primary || false,
      access_role: cal.accessRole as 'owner' | 'writer' | 'reader',
    }));

    return { success: true, data: calendars };
  }

  /**
   * Get free/busy information for calendars
   */
  async getFreeBusy(
    connection: CalendarConnection,
    calendarIds: string[],
    timeMin: string,
    timeMax: string
  ): Promise<ApiResponse<FreeBusySlot[]>> {
    const result = await this.googleApiRequest<GoogleFreeBusyResponse>(connection, '/freeBusy', {
      method: 'POST',
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: calendarIds.map((id) => ({ id })),
      }),
    });

    if (!result.success || !result.data) {
      return result as ApiResponse<FreeBusySlot[]>;
    }

    const busySlots: FreeBusySlot[] = [];
    for (const calendarId of Object.keys(result.data.calendars)) {
      const calendar = result.data.calendars[calendarId];
      if (calendar.busy) {
        for (const slot of calendar.busy) {
          busySlots.push({
            start: slot.start,
            end: slot.end,
            status: 'busy',
          });
        }
      }
    }

    // Sort by start time and merge overlapping slots
    busySlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return { success: true, data: busySlots };
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchEvents(
    connection: CalendarConnection,
    calendarId: string,
    timeMin: string,
    timeMax: string
  ): Promise<ApiResponse<CalendarEvent[]>> {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });

    const result = await this.googleApiRequest<{ items: GoogleEvent[] }>(
      connection,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
    );

    if (!result.success || !result.data) {
      return result as ApiResponse<CalendarEvent[]>;
    }

    const userId = await this.requireUserId();
    const events: CalendarEvent[] = result.data.items.map((event) => ({
      id: '', // Will be assigned when saving
      user_id: userId,
      external_id: event.id,
      external_provider: 'google',
      title: event.summary || '(No title)',
      description: event.description,
      location: event.location,
      start_time: event.start.dateTime || event.start.date || '',
      end_time: event.end.dateTime || event.end.date || '',
      timezone: event.start.timeZone || connection.settings?.timezone || 'UTC',
      is_all_day: !event.start.dateTime,
      status: (event.status as 'confirmed' | 'tentative' | 'cancelled') || 'confirmed',
      visibility: (event.visibility as 'default' | 'public' | 'private') || 'default',
      busy_status: event.transparency === 'transparent' ? 'free' : 'busy',
      recurrence_rule: event.recurrence?.[0],
      conference_url: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
      conference_provider: event.conferenceData ? 'google_meet' : undefined,
      attendees: (event.attendees || []).map((a) => ({
        email: a.email,
        name: a.displayName,
        response_status: (a.responseStatus as 'accepted' | 'declined' | 'tentative' | 'needs_action') || 'needs_action',
        is_organizer: a.organizer,
        is_optional: a.optional,
      })),
      reminders: (event.reminders?.overrides || []).map((r) => ({
        method: r.method as 'email' | 'popup',
        minutes_before: r.minutes,
      })),
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    return { success: true, data: events };
  }

  /**
   * Create event on Google Calendar
   */
  async createEvent(
    connection: CalendarConnection,
    calendarId: string,
    event: Partial<CalendarEvent>
  ): Promise<ApiResponse<string>> {
    const googleEvent: Partial<GoogleEvent> = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.is_all_day
        ? { date: event.start_time?.split('T')[0] }
        : { dateTime: event.start_time, timeZone: event.timezone },
      end: event.is_all_day
        ? { date: event.end_time?.split('T')[0] }
        : { dateTime: event.end_time, timeZone: event.timezone },
      status: event.status,
      visibility: event.visibility,
      transparency: event.busy_status === 'free' ? 'transparent' : 'opaque',
      attendees: event.attendees?.map((a) => ({
        email: a.email,
        displayName: a.name,
        optional: a.is_optional,
      })),
    };

    const result = await this.googleApiRequest<GoogleEvent>(
      connection,
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        body: JSON.stringify(googleEvent),
      }
    );

    if (!result.success || !result.data) {
      return result as ApiResponse<string>;
    }

    return { success: true, data: result.data.id };
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(
    connection: CalendarConnection,
    calendarId: string,
    eventId: string
  ): Promise<ApiResponse<void>> {
    return this.googleApiRequest(
      connection,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(): Promise<ApiResponse<void>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'google')
    );
  }
}

export const googleCalendarService = new GoogleCalendarService();
