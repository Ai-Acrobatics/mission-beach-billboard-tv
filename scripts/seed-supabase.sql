-- Mission Beach Billboard TV — Seed Data
-- Run AFTER setup-supabase.sql

-- ============================================================
-- Sample Clients
-- ============================================================
INSERT INTO clients (id, name, business_name, email, phone) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Sarah Chen', 'Belmont Park', 'sarah@belmontpark.com', '619-555-0101'),
  ('c1000000-0000-0000-0000-000000000002', 'Mike Torres', 'Mission Beach Surf Shop', 'mike@mbsurf.com', '619-555-0102'),
  ('c1000000-0000-0000-0000-000000000003', 'Lisa Nguyen', 'Pacific Beach Fish Shop', 'lisa@pbfishshop.com', '619-555-0103'),
  ('c1000000-0000-0000-0000-000000000004', 'James Kim', 'SD Bay Adventures', 'james@sdbay.com', '619-555-0104'),
  ('c1000000-0000-0000-0000-000000000005', 'Maria Rodriguez', 'Coastline Yoga', 'maria@coastlineyoga.com', '619-555-0105')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Sample Ads
-- ============================================================
INSERT INTO ads (id, title, client_id, client_name, media_url, media_type, duration_seconds, active, priority, qr_code_url) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Belmont Park — Summer Fun Awaits', 'c1000000-0000-0000-0000-000000000001', 'Belmont Park', '', 'image', 15, true, 'premium', 'https://www.belmontpark.com'),
  ('a1000000-0000-0000-0000-000000000002', 'Board Rentals from $25/day', 'c1000000-0000-0000-0000-000000000002', 'Mission Beach Surf Shop', '', 'image', 15, true, 'standard', NULL),
  ('a1000000-0000-0000-0000-000000000003', 'Fresh Catch Daily — Fish Tacos $12', 'c1000000-0000-0000-0000-000000000003', 'Pacific Beach Fish Shop', '', 'image', 15, true, 'standard', NULL),
  ('a1000000-0000-0000-0000-000000000004', 'Jet Ski & Kayak Rentals', 'c1000000-0000-0000-0000-000000000004', 'SD Bay Adventures', '', 'video', 30, true, 'premium', 'https://sdbay.com'),
  ('a1000000-0000-0000-0000-000000000005', 'Sunrise Beach Yoga — $15 Drop-In', 'c1000000-0000-0000-0000-000000000005', 'Coastline Yoga', '', 'image', 15, true, 'standard', NULL),
  ('a1000000-0000-0000-0000-000000000006', 'Belmont Park After Dark', 'c1000000-0000-0000-0000-000000000001', 'Belmont Park', '', 'video', 30, true, 'takeover', 'https://www.belmontpark.com/afterdark')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Sample Schedule Assignments
-- ============================================================
-- Belmont Park (premium) → morning + midday on weekdays
INSERT INTO schedule_assignments (ad_id, time_slot_id, day_of_week, active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'morning', 1, true),
  ('a1000000-0000-0000-0000-000000000001', 'morning', 2, true),
  ('a1000000-0000-0000-0000-000000000001', 'morning', 3, true),
  ('a1000000-0000-0000-0000-000000000001', 'morning', 4, true),
  ('a1000000-0000-0000-0000-000000000001', 'morning', 5, true)
ON CONFLICT (time_slot_id, day_of_week) DO NOTHING;

-- SD Bay Adventures (premium) → midday weekends
INSERT INTO schedule_assignments (ad_id, time_slot_id, day_of_week, active) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'midday', 0, true),
  ('a1000000-0000-0000-0000-000000000004', 'midday', 6, true)
ON CONFLICT (time_slot_id, day_of_week) DO NOTHING;

-- Belmont Park After Dark (takeover) → evening Fri-Sat
INSERT INTO schedule_assignments (ad_id, time_slot_id, day_of_week, active) VALUES
  ('a1000000-0000-0000-0000-000000000006', 'evening', 5, true),
  ('a1000000-0000-0000-0000-000000000006', 'evening', 6, true)
ON CONFLICT (time_slot_id, day_of_week) DO NOTHING;

-- Coastline Yoga → morning weekends
INSERT INTO schedule_assignments (ad_id, time_slot_id, day_of_week, active) VALUES
  ('a1000000-0000-0000-0000-000000000005', 'morning', 0, true),
  ('a1000000-0000-0000-0000-000000000005', 'morning', 6, true)
ON CONFLICT (time_slot_id, day_of_week) DO NOTHING;

-- ============================================================
-- Sample Booking (paid, live)
-- ============================================================
INSERT INTO bookings (id, client_id, business_name, contact_name, contact_email, contact_phone, time_slot_id, duration_value, duration_unit, start_date, end_date, pricing_tier, total_price, status) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Belmont Park', 'Sarah Chen', 'sarah@belmontpark.com', '619-555-0101', 'morning', 4, 'weeks', '2026-04-01', '2026-04-28', 'Growth', 2396, 'live'),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000004', 'SD Bay Adventures', 'James Kim', 'james@sdbay.com', '619-555-0104', 'midday', 2, 'weeks', '2026-04-01', '2026-04-14', 'Growth', 1198, 'live'),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Belmont Park', 'Sarah Chen', 'sarah@belmontpark.com', '619-555-0101', 'evening', 4, 'weeks', '2026-04-01', '2026-04-28', 'Takeover', 5996, 'live')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Sample Impressions (last 24 hours)
-- ============================================================
INSERT INTO impressions (ad_id, played_at, duration_seconds, time_slot_id, day_of_week) VALUES
  ('a1000000-0000-0000-0000-000000000001', now() - interval '1 hour', 15, 'evening', EXTRACT(DOW FROM now())::int),
  ('a1000000-0000-0000-0000-000000000002', now() - interval '2 hours', 15, 'evening', EXTRACT(DOW FROM now())::int),
  ('a1000000-0000-0000-0000-000000000004', now() - interval '3 hours', 30, 'midday', EXTRACT(DOW FROM now())::int),
  ('a1000000-0000-0000-0000-000000000001', now() - interval '5 hours', 15, 'midday', EXTRACT(DOW FROM now())::int),
  ('a1000000-0000-0000-0000-000000000003', now() - interval '6 hours', 15, 'midday', EXTRACT(DOW FROM now())::int),
  ('a1000000-0000-0000-0000-000000000005', now() - interval '10 hours', 15, 'morning', EXTRACT(DOW FROM now())::int),
  ('a1000000-0000-0000-0000-000000000001', now() - interval '11 hours', 15, 'morning', EXTRACT(DOW FROM now())::int),
  ('a1000000-0000-0000-0000-000000000004', now() - interval '14 hours', 30, 'night', EXTRACT(DOW FROM now() - interval '1 day')::int),
  ('a1000000-0000-0000-0000-000000000006', now() - interval '20 hours', 30, 'evening', EXTRACT(DOW FROM now() - interval '1 day')::int)
ON CONFLICT DO NOTHING;
