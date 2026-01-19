import { supabase } from '@/lib/supabase';
import { BaseApiService } from './BaseApiService';
import { logger } from '@/services/LoggingService';
import type {
  ApiResponse,
  AvailabilitySchedule,
  AvailabilityScheduleData,
  AvailabilityOverride,
} from '@/types';

const DEFAULT_SCHEDULE: AvailabilityScheduleData = {
  monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

export class AvailabilityService extends BaseApiService {
  constructor() {
    super('availability_schedules');
  }

  /**
   * Create a new availability schedule
   */
  async createSchedule(data: {
    name: string;
    timezone: string;
    schedule?: AvailabilityScheduleData;
    is_default?: boolean;
  }): Promise<ApiResponse<AvailabilitySchedule>> {
    const userId = await this.requireUserId();

    // If setting as default, unset other defaults
    if (data.is_default) {
      await supabase
        .from('availability_schedules')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const scheduleData = {
      user_id: userId,
      name: data.name,
      timezone: data.timezone,
      schedule: data.schedule || DEFAULT_SCHEDULE,
      is_default: data.is_default || false,
      overrides: [],
    };

    return this.handleResponse(
      supabase.from('availability_schedules').insert(scheduleData).select().single()
    );
  }

  /**
   * Get all availability schedules for current user
   */
  async getSchedules(): Promise<ApiResponse<AvailabilitySchedule[]>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('availability_schedules')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })
    );
  }

  /**
   * Get a single schedule by ID
   */
  async getSchedule(id: string): Promise<ApiResponse<AvailabilitySchedule>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('availability_schedules')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
    );
  }

  /**
   * Get the default schedule
   */
  async getDefaultSchedule(): Promise<ApiResponse<AvailabilitySchedule | null>> {
    const userId = await this.requireUserId();

    const { data, error } = await supabase
      .from('availability_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      logger.error('Failed to fetch default schedule:', error);
      return {
        success: false,
        error: {
          code: error.code || 'QUERY_ERROR',
          message: error.message,
        },
      };
    }

    return { success: true, data: data as AvailabilitySchedule | null };
  }

  /**
   * Update an availability schedule
   */
  async updateSchedule(
    id: string,
    data: Partial<AvailabilitySchedule>
  ): Promise<ApiResponse<AvailabilitySchedule>> {
    const userId = await this.requireUserId();

    // If setting as default, unset other defaults
    if (data.is_default) {
      await supabase
        .from('availability_schedules')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', id);
    }

    delete data.user_id;
    delete data.id;

    return this.handleResponse(
      supabase
        .from('availability_schedules')
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
   * Delete an availability schedule
   */
  async deleteSchedule(id: string): Promise<ApiResponse<void>> {
    const userId = await this.requireUserId();

    // Check if it's the default
    const { data: schedule } = await supabase
      .from('availability_schedules')
      .select('is_default')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (schedule?.is_default) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete the default schedule. Set another schedule as default first.',
        },
      };
    }

    return this.handleResponse(
      supabase
        .from('availability_schedules')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
    );
  }

  /**
   * Set a schedule as default
   */
  async setDefault(id: string): Promise<ApiResponse<AvailabilitySchedule>> {
    const userId = await this.requireUserId();

    // Unset other defaults
    await supabase
      .from('availability_schedules')
      .update({ is_default: false })
      .eq('user_id', userId);

    return this.handleResponse(
      supabase
        .from('availability_schedules')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Add an override to a schedule
   */
  async addOverride(
    scheduleId: string,
    override: AvailabilityOverride
  ): Promise<ApiResponse<AvailabilitySchedule>> {
    const userId = await this.requireUserId();

    // Get current schedule
    const { data: schedule, error: fetchError } = await supabase
      .from('availability_schedules')
      .select('overrides')
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !schedule) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        },
      };
    }

    // Add or update override for this date
    const overrides = (schedule.overrides as AvailabilityOverride[]) || [];
    const existingIndex = overrides.findIndex((o) => o.date === override.date);

    if (existingIndex >= 0) {
      overrides[existingIndex] = override;
    } else {
      overrides.push(override);
    }

    // Sort by date
    overrides.sort((a, b) => a.date.localeCompare(b.date));

    return this.handleResponse(
      supabase
        .from('availability_schedules')
        .update({ overrides })
        .eq('id', scheduleId)
        .eq('user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Remove an override from a schedule
   */
  async removeOverride(
    scheduleId: string,
    date: string
  ): Promise<ApiResponse<AvailabilitySchedule>> {
    const userId = await this.requireUserId();

    // Get current schedule
    const { data: schedule, error: fetchError } = await supabase
      .from('availability_schedules')
      .select('overrides')
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !schedule) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        },
      };
    }

    const overrides = ((schedule.overrides as AvailabilityOverride[]) || []).filter(
      (o) => o.date !== date
    );

    return this.handleResponse(
      supabase
        .from('availability_schedules')
        .update({ overrides })
        .eq('id', scheduleId)
        .eq('user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Get availability for a specific date range
   */
  async getAvailabilityForRange(
    scheduleId: string,
    startDate: string,
    endDate: string
  ): Promise<
    ApiResponse<{
      date: string;
      available: boolean;
      slots: { start: string; end: string }[];
    }[]>
  > {
    const userId = await this.requireUserId();

    const { data: schedule, error } = await supabase
      .from('availability_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .single();

    if (error || !schedule) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        },
      };
    }

    const result: { date: string; available: boolean; slots: { start: string; end: string }[] }[] =
      [];
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const;

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayName = dayNames[current.getDay()];

      // Check for override
      const override = (schedule.overrides as AvailabilityOverride[])?.find(
        (o) => o.date === dateStr
      );

      if (override) {
        result.push({
          date: dateStr,
          available: override.available,
          slots: override.slots || [],
        });
      } else {
        // Use regular schedule
        const daySchedule = (schedule.schedule as AvailabilityScheduleData)[dayName];
        result.push({
          date: dateStr,
          available: daySchedule?.enabled || false,
          slots: daySchedule?.slots || [],
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return { success: true, data: result };
  }

  /**
   * Create or ensure default schedule exists
   */
  async ensureDefaultSchedule(timezone: string): Promise<ApiResponse<AvailabilitySchedule>> {
    const existing = await this.getDefaultSchedule();

    if (existing.success && existing.data) {
      return existing as ApiResponse<AvailabilitySchedule>;
    }

    return this.createSchedule({
      name: 'Default',
      timezone,
      is_default: true,
    });
  }
}

export const availabilityService = new AvailabilityService();
