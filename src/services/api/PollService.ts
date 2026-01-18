import { supabase } from '@/lib/supabase';
import { BaseApiService, ApiErrorCodes } from './BaseApiService';
import { logger } from '@/services/LoggingService';
import type {
  ApiResponse,
  MeetingPoll,
  PollOption,
  PollVote,
  PollParticipant,
  PaginatedResponse,
} from '@/types';

export class PollService extends BaseApiService {
  constructor() {
    super('meeting_polls');
  }

  // ============================================
  // MEETING POLLS
  // ============================================

  /**
   * Create a new meeting poll
   */
  async createPoll(data: {
    title: string;
    description?: string;
    location?: string;
    duration_minutes?: number;
    timezone?: string;
    deadline?: string;
    is_anonymous?: boolean;
    allow_comments?: boolean;
    allow_maybe?: boolean;
    limit_per_option?: number;
    auto_confirm?: boolean;
    options: { start_time: string; end_time: string }[];
  }): Promise<ApiResponse<MeetingPoll>> {
    const userId = await this.requireUserId();

    // Generate unique slug
    const slug = this.generateSlug(10);

    const pollData = {
      user_id: userId,
      slug,
      title: data.title,
      description: data.description,
      location: data.location,
      duration_minutes: data.duration_minutes || 60,
      timezone: data.timezone || 'UTC',
      deadline: data.deadline,
      is_anonymous: data.is_anonymous ?? false,
      allow_comments: data.allow_comments ?? true,
      allow_maybe: data.allow_maybe ?? true,
      limit_per_option: data.limit_per_option,
      auto_confirm: data.auto_confirm ?? false,
      status: 'open' as const,
    };

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('meeting_polls')
      .insert(pollData)
      .select()
      .single();

    if (pollError || !poll) {
      logger.error('Failed to create poll:', pollError);
      return {
        success: false,
        error: {
          code: pollError?.code || 'CREATE_ERROR',
          message: pollError?.message || 'Failed to create poll',
        },
      };
    }

    // Create poll options
    const optionsData = data.options.map((opt) => ({
      poll_id: poll.id,
      start_time: opt.start_time,
      end_time: opt.end_time,
    }));

    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData)
      .select();

    if (optionsError) {
      logger.error('Failed to create poll options:', optionsError);
      // Rollback poll creation
      await supabase.from('meeting_polls').delete().eq('id', poll.id);
      return {
        success: false,
        error: {
          code: optionsError.code || 'CREATE_ERROR',
          message: optionsError.message || 'Failed to create poll options',
        },
      };
    }

    return {
      success: true,
      data: { ...poll, options } as MeetingPoll,
    };
  }

  /**
   * Get all polls for current user
   */
  async getPolls(status?: MeetingPoll['status']): Promise<ApiResponse<MeetingPoll[]>> {
    const userId = await this.requireUserId();

    let query = supabase
      .from('meeting_polls')
      .select('*, options:poll_options(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    return this.handleResponse(query);
  }

  /**
   * Get a poll by ID (for owner)
   */
  async getPoll(id: string): Promise<ApiResponse<MeetingPoll>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('meeting_polls')
        .select('*, options:poll_options(*, votes:poll_votes(*))')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
    );
  }

  /**
   * Get a poll by slug (for public voting page)
   */
  async getPollBySlug(slug: string): Promise<ApiResponse<MeetingPoll>> {
    const { data, error } = await supabase
      .from('meeting_polls')
      .select('*, options:poll_options(*), creator:profiles!user_id(email)')
      .eq('slug', slug)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code === 'PGRST116' ? ApiErrorCodes.NOT_FOUND : error.code,
          message: error.message,
        },
      };
    }

    // If poll is not open, only show to owner
    if (data.status !== 'open') {
      const userId = await this.getUserId();
      if (data.user_id !== userId) {
        return {
          success: false,
          error: {
            code: ApiErrorCodes.NOT_FOUND,
            message: 'Poll not found or no longer active',
          },
        };
      }
    }

    return { success: true, data: data as MeetingPoll };
  }

  /**
   * Update poll
   */
  async updatePoll(id: string, data: Partial<MeetingPoll>): Promise<ApiResponse<MeetingPoll>> {
    const userId = await this.requireUserId();

    // Don't allow changing user_id, slug, or status through this method
    delete data.user_id;
    delete data.slug;
    delete data.status;

    return this.handleResponse(
      supabase
        .from('meeting_polls')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Close poll
   */
  async closePoll(id: string): Promise<ApiResponse<MeetingPoll>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('meeting_polls')
        .update({ status: 'closed' })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Confirm poll with selected option
   */
  async confirmPoll(id: string, optionId: string): Promise<ApiResponse<MeetingPoll>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase
        .from('meeting_polls')
        .update({
          status: 'confirmed',
          confirmed_option_id: optionId,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Delete poll
   */
  async deletePoll(id: string): Promise<ApiResponse<void>> {
    const userId = await this.requireUserId();

    return this.handleResponse(
      supabase.from('meeting_polls').delete().eq('id', id).eq('user_id', userId)
    );
  }

  // ============================================
  // POLL OPTIONS
  // ============================================

  /**
   * Add option to poll
   */
  async addOption(
    pollId: string,
    option: { start_time: string; end_time: string }
  ): Promise<ApiResponse<PollOption>> {
    const userId = await this.requireUserId();

    // Verify poll ownership
    const { data: poll, error: pollError } = await supabase
      .from('meeting_polls')
      .select('id')
      .eq('id', pollId)
      .eq('user_id', userId)
      .single();

    if (pollError || !poll) {
      return {
        success: false,
        error: {
          code: ApiErrorCodes.NOT_FOUND,
          message: 'Poll not found',
        },
      };
    }

    return this.handleResponse(
      supabase
        .from('poll_options')
        .insert({
          poll_id: pollId,
          start_time: option.start_time,
          end_time: option.end_time,
        })
        .select()
        .single()
    );
  }

  /**
   * Remove option from poll
   */
  async removeOption(pollId: string, optionId: string): Promise<ApiResponse<void>> {
    const userId = await this.requireUserId();

    // Verify poll ownership
    const { data: poll } = await supabase
      .from('meeting_polls')
      .select('id')
      .eq('id', pollId)
      .eq('user_id', userId)
      .single();

    if (!poll) {
      return {
        success: false,
        error: {
          code: ApiErrorCodes.NOT_FOUND,
          message: 'Poll not found',
        },
      };
    }

    return this.handleResponse(
      supabase.from('poll_options').delete().eq('id', optionId).eq('poll_id', pollId)
    );
  }

  // ============================================
  // POLL VOTING
  // ============================================

  /**
   * Submit votes for a poll
   */
  async submitVotes(
    pollSlug: string,
    participant: {
      name: string;
      email?: string;
      comment?: string;
    },
    votes: Record<string, 'yes' | 'no' | 'maybe'>
  ): Promise<ApiResponse<PollVote[]>> {
    // Get poll
    const { data: poll, error: pollError } = await supabase
      .from('meeting_polls')
      .select('id, status, allow_maybe')
      .eq('slug', pollSlug)
      .single();

    if (pollError || !poll) {
      return {
        success: false,
        error: {
          code: ApiErrorCodes.NOT_FOUND,
          message: 'Poll not found',
        },
      };
    }

    if (poll.status !== 'open') {
      return {
        success: false,
        error: {
          code: ApiErrorCodes.FORBIDDEN,
          message: 'Poll is no longer accepting votes',
        },
      };
    }

    // Get current user if logged in
    const userId = await this.getUserId();

    // Check if participant already voted (by email)
    if (participant.email) {
      const { data: existingVotes } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', poll.id)
        .eq('participant_email', participant.email);

      if (existingVotes && existingVotes.length > 0) {
        // Delete existing votes to replace them
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', poll.id)
          .eq('participant_email', participant.email);
      }
    }

    // Create vote records
    const voteRecords = Object.entries(votes).map(([optionId, vote]) => ({
      poll_id: poll.id,
      option_id: optionId,
      user_id: userId,
      participant_name: participant.name,
      participant_email: participant.email,
      vote: poll.allow_maybe ? vote : vote === 'maybe' ? 'no' : vote,
      comment: participant.comment,
    }));

    return this.handleResponse(supabase.from('poll_votes').insert(voteRecords).select());
  }

  /**
   * Get poll results/participants
   */
  async getPollParticipants(pollId: string): Promise<ApiResponse<PollParticipant[]>> {
    const { data: votes, error } = await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: true });

    if (error) {
      return {
        success: false,
        error: {
          code: error.code || 'QUERY_ERROR',
          message: error.message,
        },
      };
    }

    // Group votes by participant
    const participantsMap = new Map<string, PollParticipant>();

    for (const vote of votes || []) {
      const key = vote.participant_email || vote.participant_name;
      const existing = participantsMap.get(key);

      if (existing) {
        existing.votes[vote.option_id] = vote.vote;
        if (vote.comment && !existing.comment) {
          existing.comment = vote.comment;
        }
      } else {
        participantsMap.set(key, {
          name: vote.participant_name,
          email: vote.participant_email,
          votes: { [vote.option_id]: vote.vote },
          comment: vote.comment,
        });
      }
    }

    return {
      success: true,
      data: Array.from(participantsMap.values()),
    };
  }

  /**
   * Get best options (sorted by vote count)
   */
  async getBestOptions(pollId: string): Promise<
    ApiResponse<
      {
        option: PollOption;
        yes_count: number;
        maybe_count: number;
        no_count: number;
        score: number;
      }[]
    >
  > {
    const { data: options, error } = await supabase
      .from('poll_options')
      .select('*, votes:poll_votes(*)')
      .eq('poll_id', pollId)
      .order('vote_count', { ascending: false });

    if (error) {
      return {
        success: false,
        error: {
          code: error.code || 'QUERY_ERROR',
          message: error.message,
        },
      };
    }

    const results = (options || []).map((option) => {
      const votes = option.votes || [];
      const yes_count = votes.filter((v: PollVote) => v.vote === 'yes').length;
      const maybe_count = votes.filter((v: PollVote) => v.vote === 'maybe').length;
      const no_count = votes.filter((v: PollVote) => v.vote === 'no').length;

      // Score: yes = 2 points, maybe = 1 point, no = 0 points
      const score = yes_count * 2 + maybe_count;

      return {
        option: { ...option, votes: undefined } as PollOption,
        yes_count,
        maybe_count,
        no_count,
        score,
      };
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return { success: true, data: results };
  }

  /**
   * Get poll statistics
   */
  async getPollStats(): Promise<
    ApiResponse<{
      total: number;
      open: number;
      closed: number;
      confirmed: number;
    }>
  > {
    const userId = await this.requireUserId();

    try {
      const [totalResult, openResult, closedResult, confirmedResult] = await Promise.all([
        supabase
          .from('meeting_polls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('meeting_polls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'open'),
        supabase
          .from('meeting_polls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'closed'),
        supabase
          .from('meeting_polls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'confirmed'),
      ]);

      return {
        success: true,
        data: {
          total: totalResult.count || 0,
          open: openResult.count || 0,
          closed: closedResult.count || 0,
          confirmed: confirmedResult.count || 0,
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
}

export const pollService = new PollService();
