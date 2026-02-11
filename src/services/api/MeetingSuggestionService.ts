import { supabase } from '@/lib/supabase';
import { BaseApiService } from './BaseApiService';
import { logger } from '@/services/LoggingService';
import type {
  ApiResponse,
  MeetingSuggestion,
  MeetingRequest,
  MeetingConstraints,
  ParticipantAvailability,
  Contact,
  CalendarEvent,
  AvailabilityScheduleData,
  FreeBusySlot,
} from '@/types';

const DEFAULT_CONSTRAINTS: MeetingConstraints = {
  respect_working_hours: true,
  minimize_timezone_impact: true,
  avoid_lunch_hours: true,
  max_suggestions: 5,
};

const DEFAULT_WORKING_HOURS = { start: 9, end: 17 };
const LUNCH_HOURS = { start: 12, end: 13 };

export class MeetingSuggestionService extends BaseApiService {
  constructor() {
    super('events');
  }

  /**
   * Find best meeting times based on participants' availability
   */
  async findBestMeetingTimes(request: MeetingRequest): Promise<ApiResponse<MeetingSuggestion[]>> {
    try {
      const userId = await this.requireUserId();
      const constraints = { ...DEFAULT_CONSTRAINTS, ...request.constraints };

      // Get participant data (contacts)
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .in('id', request.participants);

      if (contactsError || !contacts) {
        logger.error('Failed to fetch contacts:', contactsError);
        return {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch participant information',
          },
        };
      }

      // Get user's own profile for their timezone
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', userId)
        .single();

      const userTimezone = profile?.timezone || 'UTC';

      // Get busy times from events (if calendar is connected)
      const busyTimes = await this.getBusyTimes(userId, request.date_range.start, request.date_range.end);

      // Generate candidate time slots
      const candidates = this.generateCandidateSlots(
        request.date_range.start,
        request.date_range.end,
        request.duration_minutes,
        userTimezone
      );

      // Score each candidate
      const scoredCandidates = candidates.map((candidate) => {
        const score = this.scoreTimeSlot(
          candidate,
          contacts,
          userTimezone,
          busyTimes,
          constraints
        );
        return { ...candidate, ...score };
      });

      // Sort by score descending and filter out unavailable slots
      const sortedCandidates = scoredCandidates
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, constraints.max_suggestions);

      // Format as MeetingSuggestion
      const suggestions: MeetingSuggestion[] = sortedCandidates.map((candidate) => ({
        start_time: candidate.start,
        end_time: candidate.end,
        score: candidate.score,
        reason: this.generateReason(candidate, contacts.length),
        participant_availability: this.getParticipantAvailability(
          candidate,
          contacts,
          userTimezone
        ),
      }));

      return { success: true, data: suggestions };
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to find meeting times:', error);
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
   * Get busy times from user's calendar events
   */
  private async getBusyTimes(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<FreeBusySlot[]> {
    const { data: events } = await supabase
      .from('events')
      .select('start_time, end_time, title')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .in('busy_status', ['busy', 'tentative', 'out_of_office'])
      .gte('end_time', startDate)
      .lte('start_time', endDate);

    if (!events) return [];

    return events.map((e) => ({
      start: e.start_time,
      end: e.end_time,
      status: 'busy' as const,
      title: e.title,
    }));
  }

  /**
   * Generate candidate time slots for the date range
   */
  private generateCandidateSlots(
    startDate: string,
    endDate: string,
    durationMinutes: number,
    timezone: string
  ): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const slotDuration = durationMinutes * 60 * 1000;

    // Start from next hour
    start.setMinutes(0, 0, 0);
    if (start < new Date()) {
      start.setTime(new Date().getTime());
      start.setHours(start.getHours() + 1, 0, 0, 0);
    }

    const current = new Date(start);

    while (current < end) {
      const slotEnd = new Date(current.getTime() + slotDuration);

      // Only add slots during reasonable hours (7 AM - 10 PM in user's timezone)
      const hour = current.getHours();
      if (hour >= 7 && hour < 22) {
        slots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      // Move to next hour
      current.setTime(current.getTime() + 60 * 60 * 1000);
    }

    return slots;
  }

  /**
   * Score a time slot based on participant availability
   */
  private scoreTimeSlot(
    slot: { start: string; end: string },
    contacts: Contact[],
    userTimezone: string,
    busyTimes: FreeBusySlot[],
    constraints: MeetingConstraints
  ): { score: number; participantScores: Map<string, number> } {
    let score = 100;
    const participantScores = new Map<string, number>();
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);

    // Check if slot conflicts with busy times
    const hasConflict = busyTimes.some((busy) => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return slotStart < busyEnd && slotEnd > busyStart;
    });

    if (hasConflict) {
      return { score: 0, participantScores };
    }

    // Score each participant
    for (const contact of contacts) {
      const localHour = this.getLocalHour(slotStart, contact.timezone);
      const workStart = contact.working_hours_start ?? DEFAULT_WORKING_HOURS.start;
      const workEnd = contact.working_hours_end ?? DEFAULT_WORKING_HOURS.end;

      let participantScore = 100;

      // Check if within working hours
      if (constraints.respect_working_hours) {
        if (localHour < workStart || localHour >= workEnd) {
          participantScore -= 50; // Heavy penalty for outside working hours
        }
      }

      // Penalty for early morning or late evening
      if (localHour < 8) {
        participantScore -= 30;
      } else if (localHour >= 20) {
        participantScore -= 20;
      }

      // Penalty for lunch hours
      if (constraints.avoid_lunch_hours) {
        if (localHour >= LUNCH_HOURS.start && localHour < LUNCH_HOURS.end) {
          participantScore -= 10;
        }
      }

      // Bonus for prime working hours (10 AM - 4 PM local)
      if (localHour >= 10 && localHour < 16) {
        participantScore += 10;
      }

      participantScores.set(contact.id, participantScore);
      score += participantScore;
    }

    // Average the score across all participants
    if (contacts.length > 0) {
      score = score / (contacts.length + 1); // +1 for the user
    }

    // Bonus for minimizing timezone impact (prefer times that are reasonable for everyone)
    if (constraints.minimize_timezone_impact) {
      const minScore = Math.min(...Array.from(participantScores.values()));
      if (minScore >= 70) {
        score += 15; // Bonus if no one is severely impacted
      }
    }

    // Preference adjustments
    const userLocalHour = this.getLocalHour(slotStart, userTimezone);
    if (constraints.prefer_morning && userLocalHour >= 9 && userLocalHour < 12) {
      score += 10;
    }
    if (constraints.prefer_afternoon && userLocalHour >= 14 && userLocalHour < 17) {
      score += 10;
    }

    return { score: Math.max(0, Math.round(score)), participantScores };
  }

  /**
   * Get local hour for a given timezone
   */
  private getLocalHour(date: Date, timezone: string): number {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });
      return parseInt(formatter.format(date), 10);
    } catch {
      return date.getUTCHours();
    }
  }

  /**
   * Generate human-readable reason for suggestion
   */
  private generateReason(
    candidate: { score: number; participantScores: Map<string, number> },
    participantCount: number
  ): string {
    if (candidate.score >= 90) {
      return 'Optimal time - within working hours for all participants';
    } else if (candidate.score >= 70) {
      return 'Good time - works well for most participants';
    } else if (candidate.score >= 50) {
      return 'Acceptable time - may be early/late for some participants';
    } else {
      return 'Possible time - outside working hours for some participants';
    }
  }

  /**
   * Get detailed availability for each participant
   */
  private getParticipantAvailability(
    slot: { start: string; end: string },
    contacts: Contact[],
    userTimezone: string
  ): ParticipantAvailability[] {
    const slotStart = new Date(slot.start);

    return contacts.map((contact) => {
      const localHour = this.getLocalHour(slotStart, contact.timezone);
      const workStart = contact.working_hours_start ?? DEFAULT_WORKING_HOURS.start;
      const workEnd = contact.working_hours_end ?? DEFAULT_WORKING_HOURS.end;

      let status: ParticipantAvailability['status'] = 'available';
      const conflicts: string[] = [];

      if (localHour < workStart || localHour >= workEnd) {
        status = 'outside_hours';
        conflicts.push(`Outside working hours (${workStart}:00-${workEnd}:00)`);
      }

      if (localHour < 7 || localHour >= 22) {
        status = 'outside_hours';
        conflicts.push('Very early/late local time');
      }

      // Format local time
      const localTime = new Date(slotStart).toLocaleTimeString('en-US', {
        timeZone: contact.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      return {
        contact_id: contact.id,
        name: contact.name,
        timezone: contact.timezone,
        local_time: localTime,
        status,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    });
  }

  /**
   * Find overlap windows between multiple participants
   */
  async findOverlapWindows(
    participantIds: string[],
    dateRange: { start: string; end: string },
    minOverlapHours: number = 2
  ): Promise<
    ApiResponse<
      {
        start_hour: number;
        end_hour: number;
        participants_in_working_hours: number;
        total_participants: number;
      }[]
    >
  > {
    try {
      const userId = await this.requireUserId();

      // Get contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .in('id', participantIds);

      if (!contacts || contacts.length === 0) {
        return { success: true, data: [] };
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', userId)
        .single();

      const userTimezone = profile?.timezone || 'UTC';

      // Calculate overlap for each hour of the day
      const overlaps: {
        start_hour: number;
        end_hour: number;
        participants_in_working_hours: number;
        total_participants: number;
      }[] = [];

      for (let hour = 0; hour < 24; hour++) {
        let participantsInWorkingHours = 0;

        for (const contact of contacts) {
          // Convert hour from user's timezone to contact's timezone
          const localHour = this.convertHourBetweenTimezones(hour, userTimezone, contact.timezone);
          const workStart = contact.working_hours_start ?? DEFAULT_WORKING_HOURS.start;
          const workEnd = contact.working_hours_end ?? DEFAULT_WORKING_HOURS.end;

          if (localHour >= workStart && localHour < workEnd) {
            participantsInWorkingHours++;
          }
        }

        overlaps.push({
          start_hour: hour,
          end_hour: (hour + 1) % 24,
          participants_in_working_hours: participantsInWorkingHours,
          total_participants: contacts.length,
        });
      }

      // Filter to hours where at least some participants are available
      const significantOverlaps = overlaps.filter(
        (o) => o.participants_in_working_hours >= Math.ceil(o.total_participants * 0.5)
      );

      return { success: true, data: significantOverlaps };
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

  /**
   * Convert hour from one timezone to another
   */
  private convertHourBetweenTimezones(
    hour: number,
    fromTimezone: string,
    toTimezone: string
  ): number {
    try {
      // Create a date with the given hour
      const date = new Date();
      date.setHours(hour, 0, 0, 0);

      // Get the hour in the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: toTimezone,
        hour: 'numeric',
        hour12: false,
      });

      return parseInt(formatter.format(date), 10);
    } catch {
      return hour;
    }
  }
}

export const meetingSuggestionService = new MeetingSuggestionService();
