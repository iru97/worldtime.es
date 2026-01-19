import { supabase } from '@/lib/supabase';
import { BaseApiService } from './BaseApiService';
import { logger } from '@/services/LoggingService';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface Notification {
  id: string;
  user_id: string;
  type: 'email' | 'push' | 'in_app';
  template_name?: string;
  recipient_email?: string;
  recipient_name?: string;
  subject?: string;
  body?: string;
  variables: Record<string, string>;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error_message?: string;
  scheduled_for: string;
  sent_at?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  text_body?: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM || 'noreply@worldtime.es';

export class NotificationService extends BaseApiService {
  constructor() {
    super('notification_queue');
  }

  /**
   * Queue an email notification
   */
  async queueEmail(data: {
    templateName: string;
    recipientEmail: string;
    recipientName?: string;
    variables: Record<string, string>;
    scheduledFor?: Date;
  }): Promise<ApiResponse<Notification>> {
    const userId = await this.getUserId();

    const notificationData = {
      user_id: userId,
      type: 'email' as const,
      template_name: data.templateName,
      recipient_email: data.recipientEmail,
      recipient_name: data.recipientName,
      variables: data.variables,
      scheduled_for: data.scheduledFor?.toISOString() || new Date().toISOString(),
    };

    return this.handleResponse(
      supabase.from('notification_queue').insert(notificationData).select().single()
    );
  }

  /**
   * Queue a custom email (without template)
   */
  async queueCustomEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    body: string;
    scheduledFor?: Date;
  }): Promise<ApiResponse<Notification>> {
    const userId = await this.getUserId();

    const notificationData = {
      user_id: userId,
      type: 'email' as const,
      recipient_email: data.recipientEmail,
      recipient_name: data.recipientName,
      subject: data.subject,
      body: data.body,
      variables: {},
      scheduled_for: data.scheduledFor?.toISOString() || new Date().toISOString(),
    };

    return this.handleResponse(
      supabase.from('notification_queue').insert(notificationData).select().single()
    );
  }

  /**
   * Get user's notifications
   */
  async getNotifications(
    status?: Notification['status'],
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const userId = await this.requireUserId();

    let query = supabase
      .from('notification_queue')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      logger.error('Failed to fetch notifications:', error);
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
        data: data as Notification[],
        total: count || 0,
        page,
        page_size: pageSize,
        has_more: (count || 0) > to + 1,
      },
    };
  }

  /**
   * Get email templates
   */
  async getTemplates(): Promise<ApiResponse<EmailTemplate[]>> {
    return this.handleResponse(
      supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
    );
  }

  /**
   * Send email immediately (client-side, via Resend API)
   */
  async sendEmailNow(data: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
  }): Promise<ApiResponse<{ id: string }>> {
    if (!RESEND_API_KEY) {
      logger.warn('Resend API key not configured, email not sent');
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Email service not configured',
        },
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
          reply_to: data.replyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Failed to send email via Resend:', error);
        return {
          success: false,
          error: {
            code: 'SEND_ERROR',
            message: error.message || 'Failed to send email',
          },
        };
      }

      const result = await response.json();
      return { success: true, data: { id: result.id } };
    } catch (err) {
      const error = err as Error;
      logger.error('Email send exception:', error);
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
   * Process template and send email
   */
  async sendTemplatedEmail(data: {
    templateName: string;
    to: string;
    toName?: string;
    variables: Record<string, string>;
    replyTo?: string;
  }): Promise<ApiResponse<{ id: string }>> {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', data.templateName)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Email template "${data.templateName}" not found`,
        },
      };
    }

    // Replace variables
    let subject = template.subject;
    let html = template.html_body;
    let text = template.text_body || '';

    for (const [key, value] of Object.entries(data.variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      html = html.replace(new RegExp(placeholder, 'g'), value);
      text = text.replace(new RegExp(placeholder, 'g'), value);
    }

    // Add recipient name if provided
    if (data.toName) {
      html = html.replace('{{recipient_name}}', data.toName);
      text = text.replace('{{recipient_name}}', data.toName);
    }

    return this.sendEmailNow({
      to: data.to,
      subject,
      html,
      text: text || undefined,
      replyTo: data.replyTo,
    });
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(booking: {
    inviteeEmail: string;
    inviteeName: string;
    title: string;
    startTime: string;
    endTime: string;
    hostName: string;
    meetingUrl?: string;
    timezone: string;
  }): Promise<ApiResponse<{ id: string }>> {
    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);

    const formatOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: booking.timezone,
    };

    return this.sendTemplatedEmail({
      templateName: 'booking_confirmation',
      to: booking.inviteeEmail,
      toName: booking.inviteeName,
      variables: {
        title: booking.title,
        start_time: startDate.toLocaleString('en-US', formatOptions),
        end_time: endDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: booking.timezone,
        }),
        host_name: booking.hostName,
        invitee_name: booking.inviteeName,
        meeting_url: booking.meetingUrl || 'TBD',
      },
    });
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(booking: {
    inviteeEmail: string;
    inviteeName: string;
    title: string;
    startTime: string;
    cancellationReason?: string;
    cancelledBy: 'host' | 'invitee';
    timezone: string;
  }): Promise<ApiResponse<{ id: string }>> {
    const startDate = new Date(booking.startTime);

    return this.sendTemplatedEmail({
      templateName: 'booking_cancelled',
      to: booking.inviteeEmail,
      toName: booking.inviteeName,
      variables: {
        title: booking.title,
        start_time: startDate.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: booking.timezone,
        }),
        cancellation_reason: booking.cancellationReason || 'No reason provided',
        cancelled_by: booking.cancelledBy === 'host' ? 'the host' : 'you',
      },
    });
  }

  /**
   * Send poll invitation email
   */
  async sendPollInvitation(data: {
    recipientEmail: string;
    recipientName?: string;
    pollTitle: string;
    creatorName: string;
    pollUrl: string;
    deadline?: string;
  }): Promise<ApiResponse<{ id: string }>> {
    return this.sendTemplatedEmail({
      templateName: 'poll_invitation',
      to: data.recipientEmail,
      toName: data.recipientName,
      variables: {
        title: data.pollTitle,
        creator_name: data.creatorName,
        poll_url: data.pollUrl,
        deadline: data.deadline
          ? new Date(data.deadline).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'No deadline',
      },
    });
  }

  /**
   * Send team invitation email
   */
  async sendTeamInvitation(data: {
    recipientEmail: string;
    teamName: string;
    inviterName: string;
    inviteUrl: string;
  }): Promise<ApiResponse<{ id: string }>> {
    return this.sendTemplatedEmail({
      templateName: 'team_invitation',
      to: data.recipientEmail,
      variables: {
        team_name: data.teamName,
        inviter_name: data.inviterName,
        invite_url: data.inviteUrl,
      },
    });
  }
}

export const notificationService = new NotificationService();
