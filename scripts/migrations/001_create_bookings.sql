-- Bookings table for Mission Beach Billboard TV
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  time_slot_id text not null,
  duration_value integer not null,
  duration_unit text not null check (duration_unit in ('days', 'weeks', 'months')),
  pricing_tier text not null,
  total_price integer not null,
  request_ad_creation boolean not null default false,
  ad_notes text,
  ad_file_name text,
  ad_video_url text,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  status text not null default 'pending_review'
    check (status in ('pending_payment', 'pending_review', 'approved', 'live', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for admin queries
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_created_at on bookings(created_at desc);
