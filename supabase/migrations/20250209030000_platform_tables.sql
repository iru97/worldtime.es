/*
  # Platform Tables for Team Collaboration

  New tables for calendar integration, scheduling, and team collaboration:

  1. calendar_connections - OAuth tokens for external calendars
  2. events - Internal calendar events
  3. booking_links - Calendly-style scheduling links
  4. booking_slots - Available time slots for booking
  5. bookings - Confirmed bookings
  6. meeting_polls - Doodle-style poll scheduling
  7. poll_options - Time options for polls
  8. poll_votes - Participant votes
  9. teams - Team/workspace organization
  10. team_members - Team membership
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEAMS & WORKSPACES
-- ============================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_email TEXT,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ============================================
-- CALENDAR INTEGRATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),
  provider_account_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  calendar_name TEXT,
  is_primary BOOLEAN DEFAULT false,
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, provider_account_id)
);

-- ============================================
-- INTERNAL EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  external_id TEXT,
  external_provider TEXT CHECK (external_provider IN ('google', 'microsoft', 'apple', NULL)),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_all_day BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  visibility TEXT DEFAULT 'default' CHECK (visibility IN ('default', 'public', 'private')),
  busy_status TEXT DEFAULT 'busy' CHECK (busy_status IN ('free', 'busy', 'tentative', 'out_of_office')),
  recurrence_rule TEXT,
  conference_url TEXT,
  conference_provider TEXT,
  attendees JSONB DEFAULT '[]',
  reminders JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKING LINKS (Calendly-style)
-- ============================================

CREATE TABLE IF NOT EXISTS public.booking_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 0,
  min_notice_hours INTEGER DEFAULT 24,
  max_days_ahead INTEGER DEFAULT 60,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  location_type TEXT DEFAULT 'video' CHECK (location_type IN ('video', 'phone', 'in_person', 'custom')),
  location_value TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  requires_confirmation BOOLEAN DEFAULT false,
  collect_payment BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10, 2),
  payment_currency TEXT DEFAULT 'USD',
  questions JSONB DEFAULT '[]',
  availability_schedule JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- ============================================
-- BOOKINGS (Confirmed appointments)
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_link_id UUID NOT NULL REFERENCES public.booking_links(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  invitee_name TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_timezone TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  cancellation_reason TEXT,
  cancelled_by TEXT CHECK (cancelled_by IN ('host', 'invitee', NULL)),
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  answers JSONB DEFAULT '{}',
  meeting_url TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEETING POLLS (Doodle-style)
-- ============================================

CREATE TABLE IF NOT EXISTS public.meeting_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  deadline TIMESTAMPTZ,
  is_anonymous BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,
  allow_maybe BOOLEAN DEFAULT true,
  limit_per_option INTEGER,
  auto_confirm BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'confirmed')),
  confirmed_option_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.meeting_polls(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  vote_count INTEGER DEFAULT 0,
  maybe_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.meeting_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'maybe')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, option_id, participant_email)
);

-- ============================================
-- USER AVAILABILITY SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.availability_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_default BOOLEAN DEFAULT false,
  schedule JSONB NOT NULL DEFAULT '{
    "monday": {"enabled": true, "slots": [{"start": "09:00", "end": "17:00"}]},
    "tuesday": {"enabled": true, "slots": [{"start": "09:00", "end": "17:00"}]},
    "wednesday": {"enabled": true, "slots": [{"start": "09:00", "end": "17:00"}]},
    "thursday": {"enabled": true, "slots": [{"start": "09:00", "end": "17:00"}]},
    "friday": {"enabled": true, "slots": [{"start": "09:00", "end": "17:00"}]},
    "saturday": {"enabled": false, "slots": []},
    "sunday": {"enabled": false, "slots": []}
  }',
  overrides JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON public.teams(slug);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_user ON public.calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_provider ON public.calendar_connections(user_id, provider);

CREATE INDEX IF NOT EXISTS idx_events_user ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_team ON public.events(team_id);
CREATE INDEX IF NOT EXISTS idx_events_time ON public.events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_events_external ON public.events(external_provider, external_id);

CREATE INDEX IF NOT EXISTS idx_booking_links_user ON public.booking_links(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_links_slug ON public.booking_links(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_booking_links_team ON public.booking_links(team_id);

CREATE INDEX IF NOT EXISTS idx_bookings_link ON public.bookings(booking_link_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host ON public.bookings(host_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON public.bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

CREATE INDEX IF NOT EXISTS idx_polls_user ON public.meeting_polls(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_slug ON public.meeting_polls(slug);
CREATE INDEX IF NOT EXISTS idx_polls_status ON public.meeting_polls(status);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON public.poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option ON public.poll_votes(option_id);

CREATE INDEX IF NOT EXISTS idx_availability_user ON public.availability_schedules(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_schedules ENABLE ROW LEVEL SECURITY;

-- Teams: Owner can do anything, members can view
CREATE POLICY teams_owner_all ON public.teams FOR ALL USING (owner_id = auth.uid());
CREATE POLICY teams_member_select ON public.teams FOR SELECT USING (
  id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

-- Team Members: Team admins/owners can manage
CREATE POLICY team_members_select ON public.team_members FOR SELECT USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);
CREATE POLICY team_members_insert ON public.team_members FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY team_members_delete ON public.team_members FOR DELETE USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  OR user_id = auth.uid()
);

-- Calendar Connections: Users can only manage their own
CREATE POLICY calendar_connections_all ON public.calendar_connections FOR ALL USING (user_id = auth.uid());

-- Events: Users can manage their own, team members can view team events
CREATE POLICY events_user_all ON public.events FOR ALL USING (user_id = auth.uid());
CREATE POLICY events_team_select ON public.events FOR SELECT USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

-- Booking Links: Users manage their own
CREATE POLICY booking_links_all ON public.booking_links FOR ALL USING (user_id = auth.uid());

-- Bookings: Host can manage, anyone can create (for public booking pages)
CREATE POLICY bookings_host_all ON public.bookings FOR ALL USING (host_user_id = auth.uid());
CREATE POLICY bookings_public_insert ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY bookings_invitee_select ON public.bookings FOR SELECT USING (true);

-- Meeting Polls: Creator can manage
CREATE POLICY polls_user_all ON public.meeting_polls FOR ALL USING (user_id = auth.uid());
CREATE POLICY polls_public_select ON public.meeting_polls FOR SELECT USING (status = 'open');

-- Poll Options: Follow poll access
CREATE POLICY poll_options_user_all ON public.poll_options FOR ALL USING (
  poll_id IN (SELECT id FROM public.meeting_polls WHERE user_id = auth.uid())
);
CREATE POLICY poll_options_public_select ON public.poll_options FOR SELECT USING (
  poll_id IN (SELECT id FROM public.meeting_polls WHERE status = 'open')
);

-- Poll Votes: Anyone can vote on open polls
CREATE POLICY poll_votes_insert ON public.poll_votes FOR INSERT WITH CHECK (
  poll_id IN (SELECT id FROM public.meeting_polls WHERE status = 'open')
);
CREATE POLICY poll_votes_select ON public.poll_votes FOR SELECT USING (
  poll_id IN (SELECT id FROM public.meeting_polls WHERE status = 'open')
  OR poll_id IN (SELECT id FROM public.meeting_polls WHERE user_id = auth.uid())
);
CREATE POLICY poll_votes_update ON public.poll_votes FOR UPDATE USING (
  user_id = auth.uid() OR participant_email IS NOT NULL
);

-- Availability Schedules: Users manage their own
CREATE POLICY availability_all ON public.availability_schedules FOR ALL USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['teams', 'calendar_connections', 'events', 'booking_links', 'bookings', 'meeting_polls', 'poll_votes', 'availability_schedules'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;

-- Update poll vote counts
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.poll_options SET
      vote_count = (SELECT COUNT(*) FROM public.poll_votes WHERE option_id = NEW.option_id AND vote = 'yes'),
      maybe_count = (SELECT COUNT(*) FROM public.poll_votes WHERE option_id = NEW.option_id AND vote = 'maybe')
    WHERE id = NEW.option_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.poll_options SET
      vote_count = (SELECT COUNT(*) FROM public.poll_votes WHERE option_id = OLD.option_id AND vote = 'yes'),
      maybe_count = (SELECT COUNT(*) FROM public.poll_votes WHERE option_id = OLD.option_id AND vote = 'maybe')
    WHERE id = OLD.option_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vote_counts ON public.poll_votes;
CREATE TRIGGER update_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.poll_votes
  FOR EACH ROW EXECUTE FUNCTION update_poll_vote_counts();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate unique slug for booking links
CREATE OR REPLACE FUNCTION generate_booking_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate unique slug for polls
CREATE OR REPLACE FUNCTION generate_poll_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get user's free/busy times for a date range
CREATE OR REPLACE FUNCTION get_user_busy_times(
  p_user_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS TABLE(start_time TIMESTAMPTZ, end_time TIMESTAMPTZ, title TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT e.start_time, e.end_time, e.title
  FROM public.events e
  WHERE e.user_id = p_user_id
    AND e.status != 'cancelled'
    AND e.busy_status IN ('busy', 'tentative', 'out_of_office')
    AND e.start_time < p_end
    AND e.end_time > p_start
  ORDER BY e.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a time slot is available for a user
CREATE OR REPLACE FUNCTION is_slot_available(
  p_user_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.user_id = p_user_id
      AND e.status != 'cancelled'
      AND e.busy_status IN ('busy', 'tentative', 'out_of_office')
      AND e.start_time < p_end
      AND e.end_time > p_start
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
