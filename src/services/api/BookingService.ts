import { supabase } from '@/lib/supabase';
import { BaseApiService, ApiErrorCodes } from './BaseApiService';
import { logger } from '@/services/LoggingService';
import type {
  ApiResponse,
  BookingLink,
  Booking,
  AvailableSlot,
  AvailabilityScheduleData,
  FreeBusySlot,
  PaginatedResponse,
} from '@/types';

const DEFAULT_AVAILABILITY: AvailabilityScheduleData = {
  monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

export class BookingService extends BaseApiService {
  constructor() {
    super('booking_links');
  }

  // ============================================
  // BOOKING LINKS
  // ============================================

  /**
   * Create a new booking link
   */
  async createBookingLink(data: Partial<BookingLink>): Promise<ApiResponse<BookingLink>> {
    const userId = await this.requireUserId();

    // Generate unique slug if not provided
    let slug = data.slug || this.slugify(data.title || 'meeting');

    // Check if slug exists and append random suffix if needed
    const { data: existing } = await supabase
      .from('booking_links')
      .select('slug')
      .eq('user_id', userId)
      .eq('slug', slug)
      .single();

    if (existing) {
      slug = `${slug}-${this.generateSlug(4)}`;
    }

    const bookingLinkData = {
      user_id: userId,
      slug,
      title: data.title || 'Meeting',
      description: data.description,
      duration_minutes: data.duration_minutes || 30,
      buffer_before_minutes: data.buffer_before_minutes || 0,
      buffer_after_minutes: data.buffer_after_minutes || 0,
      min_notice_hours: data.min_notice_hours || 24,
      max_days_ahead: data.max_days_ahead || 60,
      timezone: data.timezone || 'UTC',
      location_type: data.location_type || 'video',
      location_value: data.location_value,
      color: data.color || '#3B82F6',
      is_active: data.is_active !== false,
      requires_confirmation: data.requires_confirmation || false,
      questions: data.questions || [],
      availability_schedule: data.availability_schedule || DEFAULT_AVAILABILITY,
    };

    return this.handleResponse(
      supabase.from('booking_links').insert(bookingLinkData).select().single()
    );
  }

  /**
   * Get all booking links for current user
   */
  async getBookingLinks(): Promise<ApiResponse<BookingLink[]>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('booking_links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );
  }

  /**
   * Get a booking link by ID
   */
  async getBookingLink(id: string): Promise<ApiResponse<BookingLink>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('booking_links')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
    );
  }

  /**
   * Get a booking link by slug (for public page)
   */
  async getBookingLinkBySlug(userId: string, slug: string): Promise<ApiResponse<BookingLink>> {
    return this.handleResponse(
      supabase
        .from('booking_links')
        .select('*')
        .eq('user_id', userId)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
    );
  }

  /**
   * Update a booking link
   */
  async updateBookingLink(id: string, data: Partial<BookingLink>): Promise<ApiResponse<BookingLink>> {
    const userId = await this.requireUserId();

    // Don't allow changing user_id
    delete data.user_id;

    return this.handleResponse(
      supabase
        .from('booking_links')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Delete a booking link
   */
  async deleteBookingLink(id: string): Promise<ApiResponse<void>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase.from('booking_links').delete().eq('id', id).eq('user_id', userId)
    );
  }

  // ============================================
  // AVAILABLE SLOTS
  // ============================================

  /**
   * Calculate available slots for a booking link
   */
  async getAvailableSlots(
    bookingLink: BookingLink,
    startDate: Date,
    endDate: Date,
    inviteeTimezone: string
  ): Promise<ApiResponse<AvailableSlot[]>> {
    try {
      // Get existing bookings for this link
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('booking_link_id', bookingLink.id)
        .eq('status', 'confirmed')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());

      if (bookingsError) {
        logger.error('Failed to fetch existing bookings:', bookingsError);
      }

      // Get user's events if calendar is connected
      const busySlots: FreeBusySlot[] = [];

      // Add existing bookings as busy slots
      if (existingBookings) {
        for (const booking of existingBookings) {
          busySlots.push({
            start: booking.start_time,
            end: booking.end_time,
            status: 'busy',
          });
        }
      }

      // Fetch busy times from connected calendar
      const calendarBusy = await this.getCalendarBusyTimes(bookingLink.user_id, startDate, endDate);
      busySlots.push(...calendarBusy);

      // Generate available slots based on availability schedule
      const availableSlots = this.generateAvailableSlots(
        bookingLink,
        startDate,
        endDate,
        busySlots,
        inviteeTimezone
      );

      return { success: true, data: availableSlots };
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to calculate available slots:', error);
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
   * Generate available slots based on schedule and busy times
   */
  private generateAvailableSlots(
    bookingLink: BookingLink,
    startDate: Date,
    endDate: Date,
    busySlots: FreeBusySlot[],
    inviteeTimezone: string
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const schedule = bookingLink.availability_schedule;
    const duration = bookingLink.duration_minutes;
    const bufferBefore = bookingLink.buffer_before_minutes;
    const bufferAfter = bookingLink.buffer_after_minutes;
    const minNotice = bookingLink.min_notice_hours * 60 * 60 * 1000; // Convert to ms

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const now = new Date();

    // Iterate through each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayName = dayNames[currentDate.getDay()];
      const daySchedule = schedule[dayName];

      if (daySchedule?.enabled && daySchedule.slots.length > 0) {
        for (const timeSlot of daySchedule.slots) {
          // Parse slot times
          const [startHour, startMin] = timeSlot.start.split(':').map(Number);
          const [endHour, endMin] = timeSlot.end.split(':').map(Number);

          // Create slot start time in host timezone
          const slotStart = new Date(currentDate);
          slotStart.setHours(startHour, startMin, 0, 0);

          const slotEnd = new Date(currentDate);
          slotEnd.setHours(endHour, endMin, 0, 0);

          // Generate individual bookable slots
          let current = new Date(slotStart);
          while (current.getTime() + duration * 60 * 1000 <= slotEnd.getTime()) {
            const slotEndTime = new Date(current.getTime() + duration * 60 * 1000);

            // Check minimum notice
            if (current.getTime() - now.getTime() >= minNotice) {
              // Check for conflicts with busy times (including buffers)
              const conflictStart = new Date(current.getTime() - bufferBefore * 60 * 1000);
              const conflictEnd = new Date(slotEndTime.getTime() + bufferAfter * 60 * 1000);

              const hasConflict = busySlots.some((busy) => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return conflictStart < busyEnd && conflictEnd > busyStart;
              });

              if (!hasConflict) {
                slots.push({
                  start: current.toISOString(),
                  end: slotEndTime.toISOString(),
                  timezone: inviteeTimezone,
                });
              }
            }

            // Move to next slot
            current = new Date(current.getTime() + duration * 60 * 1000);
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  // ============================================
  // BOOKINGS
  // ============================================

  /**
   * Create a new booking (from invitee)
   */
  async createBooking(data: {
    booking_link_id: string;
    invitee_name: string;
    invitee_email: string;
    invitee_timezone: string;
    start_time: string;
    end_time: string;
    notes?: string;
    answers?: Record<string, string>;
  }): Promise<ApiResponse<Booking>> {
    // Get the booking link to find the host
    const { data: bookingLink, error: linkError } = await supabase
      .from('booking_links')
      .select('user_id, requires_confirmation')
      .eq('id', data.booking_link_id)
      .single();

    if (linkError || !bookingLink) {
      return {
        success: false,
        error: {
          code: ApiErrorCodes.NOT_FOUND,
          message: 'Booking link not found',
        },
      };
    }

    const bookingData = {
      ...data,
      host_user_id: bookingLink.user_id,
      status: bookingLink.requires_confirmation ? 'pending' : 'confirmed',
    };

    return this.handleResponse(
      supabase.from('bookings').insert(bookingData).select().single()
    );
  }

  /**
   * Get bookings for current user (as host)
   */
  async getBookings(
    status?: Booking['status'],
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Booking>>> {
    const userId = await this.requireUserId();

    let query = supabase
      .from('bookings')
      .select('*, booking_link:booking_links(*)', { count: 'exact' })
      .eq('host_user_id', userId)
      .order('start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
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
        data: data as Booking[],
        total: count || 0,
        page,
        page_size: pageSize,
        has_more: (count || 0) > to + 1,
      },
    };
  }

  /**
   * Get upcoming bookings for current user
   */
  async getUpcomingBookings(limit: number = 10): Promise<ApiResponse<Booking[]>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('bookings')
        .select('*, booking_link:booking_links(*)')
        .eq('host_user_id', userId)
        .eq('status', 'confirmed')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit)
    );
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: Booking['status'],
    cancellationReason?: string
  ): Promise<ApiResponse<Booking>> {
    const userId = await this.requireUserId();

    const updateData: Partial<Booking> = { status };

    if (status === 'cancelled') {
      updateData.cancelled_by = 'host';
      updateData.cancelled_at = new Date().toISOString();
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
    }

    return this.handleResponse(
      supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .eq('host_user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Cancel booking (by invitee via token or link)
   */
  async cancelBookingByInvitee(
    id: string,
    email: string,
    reason?: string
  ): Promise<ApiResponse<Booking>> {
    return this.handleResponse(
      supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_by: 'invitee',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', id)
        .eq('invitee_email', email)
        .select()
        .single()
    );
  }

  /**
   * Get booking statistics for current user
   */
  async getBookingStats(): Promise<
    ApiResponse<{
      total: number;
      upcoming: number;
      completed: number;
      cancelled: number;
      no_shows: number;
    }>
  > {
    const userId = await this.requireUserId();
    const now = new Date().toISOString();

    try {
      const [totalResult, upcomingResult, completedResult, cancelledResult, noShowResult] =
        await Promise.all([
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('host_user_id', userId),
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('host_user_id', userId)
            .eq('status', 'confirmed')
            .gte('start_time', now),
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('host_user_id', userId)
            .eq('status', 'completed'),
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('host_user_id', userId)
            .eq('status', 'cancelled'),
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('host_user_id', userId)
            .eq('status', 'no_show'),
        ]);

      return {
        success: true,
        data: {
          total: totalResult.count || 0,
          upcoming: upcomingResult.count || 0,
          completed: completedResult.count || 0,
          cancelled: cancelledResult.count || 0,
          no_shows: noShowResult.count || 0,
        },
      };
    } catch (err) {
      const error = err as Error;
      return {
        success: false,
        error: {
          code: 'EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  // ============================================
  // CALENDAR INTEGRATION
  // ============================================

  /**
   * Get busy times from connected calendar for a specific user
   */
  private async getCalendarBusyTimes(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FreeBusySlot[]> {
    try {
      // Get user's calendar connection
      const { data: connection, error: connError } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .eq('sync_enabled', true)
        .single();

      if (connError || !connection) {
        // No calendar connected, return empty
        return [];
      }

      // Check if token needs refresh
      const expiresAt = new Date(connection.token_expires_at || 0);
      let accessToken = connection.access_token;

      if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000 && connection.refresh_token) {
        // Token expires soon, refresh it
        const refreshResult = await this.refreshGoogleToken(connection.refresh_token);
        if (refreshResult.success && refreshResult.token) {
          accessToken = refreshResult.token;
          // Update stored token
          await supabase
            .from('calendar_connections')
            .update({
              access_token: refreshResult.token,
              token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            })
            .eq('id', connection.id);
        }
      }

      // Fetch free/busy from Google Calendar
      const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          items: [{ id: connection.calendar_id || 'primary' }],
        }),
      });

      if (!response.ok) {
        logger.error('Failed to fetch Google Calendar busy times:', await response.text());
        return [];
      }

      const data = await response.json();
      const busySlots: FreeBusySlot[] = [];

      // Extract busy times from response
      const calendarId = connection.calendar_id || 'primary';
      const calendarData = data.calendars?.[calendarId];

      if (calendarData?.busy) {
        for (const slot of calendarData.busy) {
          busySlots.push({
            start: slot.start,
            end: slot.end,
            status: 'busy',
          });
        }
      }

      return busySlots;
    } catch (err) {
      const error = err as Error;
      logger.error('Error fetching calendar busy times:', error);
      return [];
    }
  }

  /**
   * Refresh Google OAuth token
   */
  private async refreshGoogleToken(
    refreshToken: string
  ): Promise<{ success: boolean; token?: string }> {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        return { success: false };
      }

      const tokens = await response.json();
      return { success: true, token: tokens.access_token };
    } catch {
      return { success: false };
    }
  }
}

export const bookingService = new BookingService();
