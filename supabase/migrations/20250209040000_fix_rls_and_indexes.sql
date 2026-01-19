/*
  # Fix RLS Policies and Add Performance Indexes

  This migration addresses security vulnerabilities and performance gaps:

  1. Fix overly permissive booking INSERT policy
  2. Add missing indexes for common query patterns
  3. Add audit log table for sensitive operations
  4. Add email templates table for notifications
*/

-- ============================================
-- FIX RLS POLICIES
-- ============================================

-- Drop the overly permissive booking insert policy
DROP POLICY IF EXISTS bookings_public_insert ON public.bookings;

-- Create a more restrictive booking insert policy
-- Only allow insert if the booking_link exists and is active
CREATE POLICY bookings_public_insert ON public.bookings FOR INSERT WITH CHECK (
  booking_link_id IN (
    SELECT id FROM public.booking_links
    WHERE is_active = true
  )
);

-- Add policy for invitees to view their own bookings by email
DROP POLICY IF EXISTS bookings_invitee_select ON public.bookings;
CREATE POLICY bookings_invitee_select ON public.bookings FOR SELECT USING (
  -- Host can view all
  host_user_id = auth.uid() OR
  -- Public can view confirmed bookings (for confirmation pages)
  status IN ('confirmed', 'pending')
);

-- Add policy for poll votes update (allow participants to change their votes)
DROP POLICY IF EXISTS poll_votes_update ON public.poll_votes;
CREATE POLICY poll_votes_update ON public.poll_votes FOR UPDATE USING (
  -- User can update their own votes
  (user_id IS NOT NULL AND user_id = auth.uid()) OR
  -- Anonymous users can update by email match (handled in app layer)
  (user_id IS NULL AND participant_email IS NOT NULL)
);

-- Add policy for poll votes delete
CREATE POLICY poll_votes_delete ON public.poll_votes FOR DELETE USING (
  -- Poll creator can delete any votes
  poll_id IN (SELECT id FROM public.meeting_polls WHERE user_id = auth.uid()) OR
  -- Users can delete their own votes
  (user_id IS NOT NULL AND user_id = auth.uid())
);

-- ============================================
-- ADD PERFORMANCE INDEXES
-- ============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_host_created
  ON public.bookings(host_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_link_status_time
  ON public.bookings(booking_link_id, status, start_time);

CREATE INDEX IF NOT EXISTS idx_events_user_time
  ON public.events(user_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_team_members_team_user
  ON public.team_members(team_id, user_id);

CREATE INDEX IF NOT EXISTS idx_polls_user_status
  ON public.meeting_polls(user_id, status);

CREATE INDEX IF NOT EXISTS idx_poll_votes_participant
  ON public.poll_votes(participant_email);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_booking_links_active
  ON public.booking_links(user_id, slug) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_polls_open
  ON public.meeting_polls(slug) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_bookings_upcoming
  ON public.bookings(host_user_id, start_time)
  WHERE status = 'confirmed' AND start_time > NOW();

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view their own audit logs
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- System can insert audit logs (via service role)
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, html_body, text_body, variables) VALUES
(
  'booking_confirmation',
  'Booking Confirmed: {{title}}',
  '<h1>Your booking is confirmed!</h1><p>Meeting: {{title}}</p><p>Time: {{start_time}} - {{end_time}}</p><p>With: {{host_name}}</p>',
  'Your booking is confirmed!\n\nMeeting: {{title}}\nTime: {{start_time}} - {{end_time}}\nWith: {{host_name}}',
  '["title", "start_time", "end_time", "host_name", "invitee_name", "meeting_url"]'
),
(
  'booking_cancelled',
  'Booking Cancelled: {{title}}',
  '<h1>Booking cancelled</h1><p>The following booking has been cancelled:</p><p>Meeting: {{title}}</p><p>Original time: {{start_time}}</p><p>Reason: {{cancellation_reason}}</p>',
  'Booking cancelled\n\nThe following booking has been cancelled:\nMeeting: {{title}}\nOriginal time: {{start_time}}\nReason: {{cancellation_reason}}',
  '["title", "start_time", "cancellation_reason", "cancelled_by"]'
),
(
  'booking_reminder',
  'Reminder: {{title}} starting soon',
  '<h1>Meeting Reminder</h1><p>Your meeting "{{title}}" starts in {{minutes_until}} minutes.</p><p>Join: <a href="{{meeting_url}}">{{meeting_url}}</a></p>',
  'Meeting Reminder\n\nYour meeting "{{title}}" starts in {{minutes_until}} minutes.\nJoin: {{meeting_url}}',
  '["title", "minutes_until", "meeting_url", "start_time"]'
),
(
  'poll_invitation',
  'Vote on meeting time: {{title}}',
  '<h1>Help pick a meeting time</h1><p>{{creator_name}} has invited you to vote on a meeting time for "{{title}}".</p><p>Vote here: <a href="{{poll_url}}">{{poll_url}}</a></p>',
  'Help pick a meeting time\n\n{{creator_name}} has invited you to vote on a meeting time for "{{title}}".\nVote here: {{poll_url}}',
  '["title", "creator_name", "poll_url", "deadline"]'
),
(
  'poll_confirmed',
  'Meeting Confirmed: {{title}}',
  '<h1>Meeting time confirmed!</h1><p>The meeting "{{title}}" has been scheduled for {{confirmed_time}}.</p><p>See you there!</p>',
  'Meeting time confirmed!\n\nThe meeting "{{title}}" has been scheduled for {{confirmed_time}}.\nSee you there!',
  '["title", "confirmed_time", "location"]'
),
(
  'team_invitation',
  'You''ve been invited to join {{team_name}}',
  '<h1>Team Invitation</h1><p>{{inviter_name}} has invited you to join the team "{{team_name}}" on WorldTime.</p><p>Accept invitation: <a href="{{invite_url}}">{{invite_url}}</a></p>',
  'Team Invitation\n\n{{inviter_name}} has invited you to join the team "{{team_name}}" on WorldTime.\nAccept invitation: {{invite_url}}',
  '["team_name", "inviter_name", "invite_url"]'
)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Email templates are readable by all authenticated users
CREATE POLICY email_templates_select ON public.email_templates FOR SELECT
  USING (is_active = true);

-- ============================================
-- NOTIFICATION QUEUE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'push', 'in_app')),
  template_name TEXT REFERENCES public.email_templates(name),
  recipient_email TEXT,
  recipient_name TEXT,
  subject TEXT,
  body TEXT,
  variables JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  error_message TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notification_queue(user_id);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY notifications_select ON public.notification_queue FOR SELECT
  USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY notifications_insert ON public.notification_queue FOR INSERT
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Create booking event
-- ============================================

CREATE OR REPLACE FUNCTION create_event_for_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_link public.booking_links;
  v_event_id UUID;
BEGIN
  -- Only create event when booking is confirmed
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    -- Get booking link details
    SELECT * INTO v_booking_link FROM public.booking_links WHERE id = NEW.booking_link_id;

    -- Create internal event
    INSERT INTO public.events (
      user_id,
      title,
      description,
      location,
      start_time,
      end_time,
      timezone,
      status,
      busy_status,
      attendees,
      metadata
    ) VALUES (
      NEW.host_user_id,
      v_booking_link.title || ' with ' || NEW.invitee_name,
      'Booked via WorldTime. Notes: ' || COALESCE(NEW.notes, ''),
      v_booking_link.location_value,
      NEW.start_time,
      NEW.end_time,
      NEW.invitee_timezone,
      'confirmed',
      'busy',
      jsonb_build_array(jsonb_build_object(
        'email', NEW.invitee_email,
        'name', NEW.invitee_name,
        'response_status', 'accepted'
      )),
      jsonb_build_object('booking_id', NEW.id)
    )
    RETURNING id INTO v_event_id;

    -- Update booking with event reference
    NEW.event_id := v_event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_booking_event ON public.bookings;
CREATE TRIGGER create_booking_event
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION create_event_for_booking();

-- ============================================
-- HELPER FUNCTION: Queue notification
-- ============================================

CREATE OR REPLACE FUNCTION queue_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue confirmation email on new confirmed booking
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO public.notification_queue (
      user_id,
      type,
      template_name,
      recipient_email,
      recipient_name,
      variables
    ) VALUES (
      NEW.host_user_id,
      'email',
      'booking_confirmation',
      NEW.invitee_email,
      NEW.invitee_name,
      jsonb_build_object(
        'title', (SELECT title FROM public.booking_links WHERE id = NEW.booking_link_id),
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'invitee_name', NEW.invitee_name,
        'meeting_url', NEW.meeting_url
      )
    );
  END IF;

  -- Queue cancellation email
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    INSERT INTO public.notification_queue (
      user_id,
      type,
      template_name,
      recipient_email,
      recipient_name,
      variables
    ) VALUES (
      NEW.host_user_id,
      'email',
      'booking_cancelled',
      NEW.invitee_email,
      NEW.invitee_name,
      jsonb_build_object(
        'title', (SELECT title FROM public.booking_links WHERE id = NEW.booking_link_id),
        'start_time', NEW.start_time,
        'cancellation_reason', COALESCE(NEW.cancellation_reason, 'No reason provided'),
        'cancelled_by', NEW.cancelled_by
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS queue_booking_notifications ON public.bookings;
CREATE TRIGGER queue_booking_notifications
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION queue_booking_notification();
