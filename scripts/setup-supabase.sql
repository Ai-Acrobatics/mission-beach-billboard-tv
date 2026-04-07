-- Mission Beach Billboard TV — Complete Supabase Schema
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. CLIENTS table
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_business ON clients (business_name);

-- ============================================================
-- 2. ADS table
-- ============================================================
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT 'Direct Upload',
  media_url TEXT NOT NULL DEFAULT '',
  media_type TEXT NOT NULL DEFAULT 'video' CHECK (media_type IN ('video', 'image')),
  duration_seconds INTEGER NOT NULL DEFAULT 15,
  active BOOLEAN NOT NULL DEFAULT true,
  priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('standard', 'premium', 'takeover')),
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ads_active_priority ON ads (active, priority);
CREATE INDEX IF NOT EXISTS idx_ads_client ON ads (client_id);

-- ============================================================
-- 3. SCHEDULE_ASSIGNMENTS table (daypart scheduling)
-- ============================================================
CREATE TABLE IF NOT EXISTS schedule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  time_slot_id TEXT NOT NULL,  -- 'morning', 'midday', 'evening', 'night'
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, 6=Sat
  active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(time_slot_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_schedule_slot_day
  ON schedule_assignments (time_slot_id, day_of_week, active);

-- ============================================================
-- 4. BOOKINGS table (ad slot purchases)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  time_slot_id TEXT NOT NULL,
  duration_value INTEGER NOT NULL DEFAULT 1,
  duration_unit TEXT NOT NULL DEFAULT 'weeks' CHECK (duration_unit IN ('days', 'weeks', 'months')),
  start_date DATE NOT NULL,
  end_date DATE,
  ad_video_url TEXT,
  request_ad_creation BOOLEAN NOT NULL DEFAULT false,
  ad_notes TEXT,
  pricing_tier TEXT NOT NULL,
  total_price INTEGER NOT NULL DEFAULT 0,  -- cents
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'pending_review', 'approved', 'live', 'completed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings (client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe ON bookings (stripe_session_id);

-- ============================================================
-- 5. IMPRESSIONS table (ad play tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL,
  time_slot_id TEXT,
  day_of_week INTEGER
);

CREATE INDEX IF NOT EXISTS idx_impressions_ad ON impressions (ad_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_impressions_date ON impressions (played_at DESC);

-- ============================================================
-- 6. STORAGE BUCKET for ad media
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY IF NOT EXISTS "Public read access for ads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ads');

-- Service role upload/delete
CREATE POLICY IF NOT EXISTS "Service role upload for ads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ads');

CREATE POLICY IF NOT EXISTS "Service role delete for ads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ads');

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by Next.js API routes)
CREATE POLICY "Service role full access on clients"
  ON clients FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on ads"
  ON ads FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on schedule_assignments"
  ON schedule_assignments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on bookings"
  ON bookings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on impressions"
  ON impressions FOR ALL USING (true) WITH CHECK (true);

-- Public read for ads (player needs this)
CREATE POLICY "Public read on ads"
  ON ads FOR SELECT USING (true);

-- Public read on schedule_assignments (player needs this)
CREATE POLICY "Public read on schedule_assignments"
  ON schedule_assignments FOR SELECT USING (true);
