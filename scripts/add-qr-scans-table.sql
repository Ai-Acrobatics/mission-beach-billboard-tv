-- QR Scan Tracking — Add to Supabase SQL Editor
-- Related: AI-3711

CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_qr_scans_ad ON qr_scans (ad_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scans_date ON qr_scans (scanned_at DESC);

-- RLS
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on qr_scans"
  ON qr_scans FOR ALL USING (true) WITH CHECK (true);
