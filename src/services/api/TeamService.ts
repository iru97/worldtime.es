import { supabase } from '@/lib/supabase';
import { BaseApiService } from './BaseApiService';
import { logger } from '@/services/LoggingService';
import type {
  ApiResponse,
  Team,
  TeamMember,
  TeamSettings,
  PaginatedResponse,
} from '@/types';

export class TeamService extends BaseApiService {
  constructor() {
    super('teams');
  }

  /**
   * Create a new team
   */
  async createTeam(data: {
    name: string;
    description?: string;
    settings?: Partial<TeamSettings>;
  }): Promise<ApiResponse<Team>> {
    const userId = await this.requireUserId();

    // Generate unique slug
    let slug = this.slugify(data.name);
    const { data: existing } = await supabase
      .from('teams')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existing) {
      slug = `${slug}-${this.generateSlug(4)}`;
    }

    const teamData = {
      name: data.name,
      slug,
      owner_id: userId,
      description: data.description,
      settings: {
        default_timezone: 'UTC',
        allow_member_invites: true,
        require_calendar_sync: false,
        ...data.settings,
      },
    };

    // Create team and add owner as member
    const { data: team, error } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create team:', error);
      return {
        success: false,
        error: {
          code: error.code || 'CREATE_ERROR',
          message: error.message,
        },
      };
    }

    // Add owner as team member
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      role: 'owner',
      joined_at: new Date().toISOString(),
    });

    return { success: true, data: team as Team };
  }

  /**
   * Get all teams for current user
   */
  async getTeams(): Promise<ApiResponse<Team[]>> {
    const userId = await this.requireUserId();

    // Get teams where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (memberError) {
      logger.error('Failed to fetch team memberships:', memberError);
      return {
        success: false,
        error: {
          code: memberError.code || 'QUERY_ERROR',
          message: memberError.message,
        },
      };
    }

    const teamIds = memberships?.map((m) => m.team_id) || [];

    if (teamIds.length === 0) {
      return { success: true, data: [] };
    }

    return this.handleResponse(
      supabase
        .from('teams')
        .select('*')
        .in('id', teamIds)
        .order('name', { ascending: true })
    );
  }

  /**
   * Get a single team by ID
   */
  async getTeam(id: string): Promise<ApiResponse<Team>> {
    return this.handleResponse(
      supabase.from('teams').select('*').eq('id', id).single()
    );
  }

  /**
   * Get a team by slug
   */
  async getTeamBySlug(slug: string): Promise<ApiResponse<Team>> {
    return this.handleResponse(
      supabase.from('teams').select('*').eq('slug', slug).single()
    );
  }

  /**
   * Update a team
   */
  async updateTeam(id: string, data: Partial<Team>): Promise<ApiResponse<Team>> {
    const userId = await this.requireUserId();

    // Verify ownership
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!team || team.owner_id !== userId) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the team owner can update team settings',
        },
      };
    }

    delete data.owner_id;
    delete data.id;

    return this.handleResponse(
      supabase
        .from('teams')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
    );
  }

  /**
   * Delete a team
   */
  async deleteTeam(id: string): Promise<ApiResponse<void>> {
    const userId = await this.requireUserId();

    // Verify ownership
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!team || team.owner_id !== userId) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the team owner can delete the team',
        },
      };
    }

    return this.handleResponse(supabase.from('teams').delete().eq('id', id));
  }

  // ============================================
  // TEAM MEMBERS
  // ============================================

  /**
   * Get team members
   */
  async getTeamMembers(
    teamId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ApiResponse<PaginatedResponse<TeamMember>>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact' })
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true })
      .range(from, to);

    if (error) {
      logger.error('Failed to fetch team members:', error);
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
        data: data as TeamMember[],
        total: count || 0,
        page,
        page_size: pageSize,
        has_more: (count || 0) > to + 1,
      },
    };
  }

  /**
   * Invite a user to the team
   */
  async inviteMember(
    teamId: string,
    email: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<ApiResponse<TeamMember>> {
    const userId = await this.requireUserId();

    // Verify user has permission to invite
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to invite members',
        },
      };
    }

    // Check if already a member
    const { data: existingByEmail } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('invited_email', email)
      .single();

    if (existingByEmail) {
      return {
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'This email has already been invited',
        },
      };
    }

    // Check if user exists and get their ID
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Check if already a member by user_id
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        return {
          success: false,
          error: {
            code: 'ALREADY_EXISTS',
            message: 'This user is already a team member',
          },
        };
      }

      // Add existing user directly
      return this.handleResponse(
        supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: existingUser.id,
            role,
            invited_email: email,
            invited_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          })
          .select()
          .single()
      );
    }

    // Create pending invitation
    return this.handleResponse(
      supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId, // Temporary, will be updated when user joins
          role,
          invited_email: email,
          invited_at: new Date().toISOString(),
        })
        .select()
        .single()
    );
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    teamId: string,
    memberId: string,
    role: 'admin' | 'member'
  ): Promise<ApiResponse<TeamMember>> {
    const userId = await this.requireUserId();

    // Verify user is owner
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (!team || team.owner_id !== userId) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the team owner can change member roles',
        },
      };
    }

    return this.handleResponse(
      supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId)
        .eq('team_id', teamId)
        .select()
        .single()
    );
  }

  /**
   * Remove a member from the team
   */
  async removeMember(teamId: string, memberId: string): Promise<ApiResponse<void>> {
    const userId = await this.requireUserId();

    // Get member info
    const { data: member } = await supabase
      .from('team_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single();

    if (!member) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Member not found',
        },
      };
    }

    // Can't remove owner
    if (member.role === 'owner') {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot remove team owner',
        },
      };
    }

    // Check if user has permission (owner/admin or removing self)
    if (member.user_id !== userId) {
      const { data: userMembership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to remove members',
          },
        };
      }
    }

    return this.handleResponse(
      supabase.from('team_members').delete().eq('id', memberId)
    );
  }

  /**
   * Leave a team
   */
  async leaveTeam(teamId: string): Promise<ApiResponse<void>> {
    const userId = await this.requireUserId();

    // Get membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'You are not a member of this team',
        },
      };
    }

    if (membership.role === 'owner') {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Owner cannot leave the team. Transfer ownership first or delete the team.',
        },
      };
    }

    return this.handleResponse(
      supabase.from('team_members').delete().eq('id', membership.id)
    );
  }

  /**
   * Transfer team ownership
   */
  async transferOwnership(
    teamId: string,
    newOwnerId: string
  ): Promise<ApiResponse<Team>> {
    const userId = await this.requireUserId();

    // Verify current ownership
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (!team || team.owner_id !== userId) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the team owner can transfer ownership',
        },
      };
    }

    // Verify new owner is a member
    const { data: newOwnerMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', newOwnerId)
      .single();

    if (!newOwnerMember) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'New owner must be a team member',
        },
      };
    }

    // Update team owner
    const { data: updatedTeam, error: teamError } = await supabase
      .from('teams')
      .update({ owner_id: newOwnerId })
      .eq('id', teamId)
      .select()
      .single();

    if (teamError) {
      return {
        success: false,
        error: {
          code: teamError.code || 'UPDATE_ERROR',
          message: teamError.message,
        },
      };
    }

    // Update member roles
    await supabase
      .from('team_members')
      .update({ role: 'owner' })
      .eq('team_id', teamId)
      .eq('user_id', newOwnerId);

    await supabase
      .from('team_members')
      .update({ role: 'admin' })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    return { success: true, data: updatedTeam as Team };
  }

  /**
   * Get user's role in a team
   */
  async getUserRole(teamId: string): Promise<ApiResponse<TeamMember['role'] | null>> {
    const userId = await this.getUserId();
    if (!userId) {
      return { success: true, data: null };
    }

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    return { success: true, data: membership?.role || null };
  }

  /**
   * Helper to create URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50);
  }
}

export const teamService = new TeamService();
