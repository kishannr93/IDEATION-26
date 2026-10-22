-- IDEATION 2026 Production Database Migration
-- Target: Supabase (PostgreSQL 15+)
-- Row Level Security (RLS) enabled on all tables
-- Private storage bucket configured for payment receipts

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
  id VARCHAR(20) PRIMARY KEY, -- e.g. IDN-0001
  team_name VARCHAR(100) NOT NULL UNIQUE,
  college VARCHAR(250) NOT NULL,
  city VARCHAR(100) NOT NULL,
  department VARCHAR(120) NOT NULL,
  course VARCHAR(50) NOT NULL,
  primary_track VARCHAR(80) NOT NULL,
  backup_track VARCHAR(80),
  idea_title VARCHAR(200) NOT NULL,
  idea_summary TEXT NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Verified', 'Rejected')),
  payment_txn_id VARCHAR(100),
  payment_screenshot_url TEXT,
  payment_remarks TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  leader_email VARCHAR(180) NOT NULL,
  leader_password_hash VARCHAR(256),
  access_token VARCHAR(64) DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookup speed
CREATE INDEX IF NOT EXISTS idx_teams_leader_email ON public.teams(leader_email);
CREATE INDEX IF NOT EXISTS idx_teams_payment_status ON public.teams(payment_status);

-- 3. MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id VARCHAR(20) NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  usn VARCHAR(30) NOT NULL,
  branch VARCHAR(80) NOT NULL,
  year VARCHAR(20) NOT NULL,
  is_leader BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_team_id ON public.members(team_id);
CREATE INDEX IF NOT EXISTS idx_members_usn ON public.members(usn);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);

-- 4. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'Update' CHECK (category IN ('Update', 'Deadline', 'Urgent', 'Result')),
  pinned BOOLEAN DEFAULT FALSE,
  author VARCHAR(100) DEFAULT 'Anveshan Core Team',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADMIN USERS TABLE (For RBAC & Audits)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(180) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EVENT SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.event_settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- TEAMS POLICIES ---
-- Anonymous / any user can submit a new team registration
CREATE POLICY "Public registration insert"
  ON public.teams
  FOR INSERT
  WITH CHECK (true);

-- Team leader can read their own team using access token or matching email
CREATE POLICY "Team leader self view"
  ON public.teams
  FOR SELECT
  USING (
    public.is_admin() OR
    leader_email = auth.jwt() ->> 'email'
  );

-- Only admins can update team status (e.g. verify payment, check in)
CREATE POLICY "Admin full team control"
  ON public.teams
  FOR ALL
  USING (public.is_admin());

-- --- MEMBERS POLICIES ---
CREATE POLICY "Public members insert"
  ON public.members
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Team leader view members"
  ON public.members
  FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = members.team_id
      AND teams.leader_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admin full members control"
  ON public.members
  FOR ALL
  USING (public.is_admin());

-- --- ANNOUNCEMENTS POLICIES ---
-- Public can read all published announcements
CREATE POLICY "Public read announcements"
  ON public.announcements
  FOR SELECT
  USING (true);

-- Only admin can insert/update/delete announcements
CREATE POLICY "Admin write announcements"
  ON public.announcements
  FOR ALL
  USING (public.is_admin());

-- --- EVENT SETTINGS POLICIES ---
CREATE POLICY "Public read event settings"
  ON public.event_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admin manage event settings"
  ON public.event_settings
  FOR ALL
  USING (public.is_admin());

-- =======================================================
-- 8. STORAGE BUCKET FOR PAYMENT PROOFS (PRIVATE)
-- =======================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false, -- STRICTLY PRIVATE
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880;

-- Allow public upload of payment screenshot during team registration
CREATE POLICY "Public upload payment proof"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs');

-- Read access is strictly private: only admins or signed URL generator can read
CREATE POLICY "Admin read payment proofs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'payment-proofs' AND public.is_admin());

-- =======================================================
-- 9. SECURE SUPER ADMIN INITIALIZATION FUNCTION
-- =======================================================
-- Run this function in Supabase SQL Editor to elevate an invited user to Super Admin:
-- SELECT public.promote_to_admin('gouthamga88@gmail.com');
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_email VARCHAR)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  IF target_user_id IS NULL THEN
    RETURN 'Error: User with email ' || target_email || ' has not registered in Supabase Auth yet. Please invite or sign up first.';
  END IF;

  INSERT INTO public.admin_profiles (id, email, full_name, role)
  VALUES (target_user_id, target_email, 'Super Administrator', 'super_admin')
  ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

  RETURN 'Success: ' || target_email || ' elevated to Super Admin.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
