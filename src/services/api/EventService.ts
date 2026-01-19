import { supabase } from '@/lib/supabase';
import { BaseApiService } from './BaseApiService';
import { logger } from '@/services/LoggingService';
import type {
  ApiResponse,
  CalendarEvent,
  PaginatedResponse,
} from '@/types';

export class EventService extends BaseApiService {
  constructor() {
    super('events');
  }

  /**
   * Create a new event
   */
  async createEvent(data: Partial<CalendarEvent>): Promise<ApiResponse<CalendarEvent>> {
    const userId = await this.requireUserId();

    const eventData = {
      user_id: userId,
      title: data.title || 'Untitled Event',
      description: data.description,
      location: data.location,
      start_time: data.start_time,
      end_time: data.end_time,
      timezone: data.timezone || 'UTC',
      is_all_day: data.is_all_day || false,
      status: data.status || 'confirmed',
      visibility: data.visibility || 'default',
      busy_status: data.busy_status || 'busy',
      recurrence_rule: data.recurrence_rule,
      conference_url: data.conference_url,
      conference_provider: data.conference_provider,
      attendees: data.attendees || [],
      reminders: data.reminders || [],
      metadata: data.metadata || {},
      team_id: data.team_id,
    };

    return this.handleResponse(
      supabase.from('events').insert(eventData).select().single()
    );
  }

  /**
   * Get all events for current user
   */
  async getEvents(
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ApiResponse<PaginatedResponse<CalendarEvent>>> {
    const userId = await this.requireUserId();

    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      logger.error('Failed to fetch events:', error);
      return {
        success: false,
        error: {
          code: error.code || 'QUERY_ERROR',
          message: error.message,
        },
      };
    }

    return {
      success: true,
      data: {
        data: data as CalendarEvent[],
        total: count || 0,
        page,
        page_size: pageSize,
        has_more: (count || 0) > to + 1,
      },
    };
  }

  /**
   * Get a single event by ID
   */
  async getEvent(id: string): Promise<ApiResponse<CalendarEvent>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
    );
  }

  /**
   * Get events for a specific date range
   */
  async getEventsInRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<CalendarEvent[]>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate)
        .lte('end_time', endDate)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })
    );
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 10): Promise<ApiResponse<CalendarEvent[]>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit)
    );
  }

  /**
   * Update an event
   */
  async updateEvent(
    id: string,
    data: Partial<CalendarEvent>
  ): Promise<ApiResponse<CalendarEvent>> {
    const userId = await this.requireUserId();

    // Don't allow changing user_id
    delete data.user_id;
    delete data.id;

    return this.handleResponse(
      supabase
        .from('events')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<ApiResponse<void>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase.from('events').delete().eq('id', id).eq('user_id', userId)
    );
  }

  /**
   * Cancel an event (soft delete)
   */
  async cancelEvent(id: string): Promise<ApiResponse<CalendarEvent>> {
    return this.updateEvent(id, { status: 'cancelled' });
  }

  /**
   * Get team events
   */
  async getTeamEvents(
    teamId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<CalendarEvent[]>> {
    let query = supabase
      .from('events')
      .select('*')
      .eq('team_id', teamId)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    return this.handleResponse(query);
  }

  /**
   * Check for conflicts with existing events
   */
  async checkConflicts(
    startTime: string,
    endTime: string,
    excludeEventId?: string
  ): Promise<ApiResponse<CalendarEvent[]>> {
    const userId = await this.requireUserId();

    let query = supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .eq('busy_status', 'busy')
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    if (excludeEventId) {
      query = query.neq('id', excludeEventId);
    }

    return this.handleResponse(query);
  }

  /**
   * Sync events from external calendar
   */
  async syncFromExternal(
    events: CalendarEvent[],
    provider: 'google' | 'microsoft' | 'apple'
  ): Promise<ApiResponse<{ created: number; updated: number; deleted: number }>> {
    const userId = await this.requireUserId();

    try {
      let created = 0;
      let updated = 0;

      for (const event of events) {
        // Check if event already exists
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('user_id', userId)
          .eq('external_provider', provider)
          .eq('external_id', event.external_id)
          .single();

        if (existing) {
          // Update existing event
          await supabase
            .from('events')
            .update({
              title: event.title,
              description: event.description,
              location: event.location,
              start_time: event.start_time,
              end_time: event.end_time,
              timezone: event.timezone,
              is_all_day: event.is_all_day,
              status: event.status,
              visibility: event.visibility,
              busy_status: event.busy_status,
              conference_url: event.conference_url,
              attendees: event.attendees,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          updated++;
        } else {
          // Create new event
          await supabase.from('events').insert({
            user_id: userId,
            external_id: event.external_id,
            external_provider: provider,
            title: event.title,
            description: event.description,
            location: event.location,
            start_time: event.start_time,
            end_time: event.end_time,
            timezone: event.timezone,
            is_all_day: event.is_all_day,
            status: event.status,
            visibility: event.visibility,
            busy_status: event.busy_status,
            conference_url: event.conference_url,
            attendees: event.attendees,
            metadata: event.metadata,
          });
          created++;
        }
      }

      return {
        success: true,
        data: { created, updated, deleted: 0 },
      };
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to sync events:', error);
      return {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error.message,
        },
      };
    }
  }
}

export const eventService = new EventService();
