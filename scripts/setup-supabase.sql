-- Mission Beach Billboard TV — Supabase Setup
-- Run this in the Supabase SQL Editor to create the required tables and storage

-- 1. Ads table
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_id TEXT,
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

-- Index for player queries (active ads sorted by priority)
CREATE INDEX IF NOT EXISTS idx_ads_active_priority ON ads (active, priority);

-- 2. Storage bucket for ad media
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to ad files
CREATE POLICY IF NOT EXISTS "Public read access for ads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ads');

-- Allow authenticated uploads (service role handles this server-side)
CREATE POLICY IF NOT EXISTS "Service role upload for ads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ads');

CREATE POLICY IF NOT EXISTS "Service role delete for ads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ads');
