/**
 * Database types matching the Supabase schema defined in scripts/setup-supabase.sql.
 * These are the raw row shapes returned by Supabase queries.
 */

export interface DbClient {
  id: string;
  name: string;
  business_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAd {
  id: string;
  title: string;
  client_id: string | null;
  client_name: string;
  media_url: string;
  media_type: "video" | "image";
  duration_seconds: number;
  active: boolean;
  priority: "standard" | "premium" | "takeover";
  qr_code_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbScheduleAssignment {
  id: string;
  ad_id: string;
  time_slot_id: string;
  day_of_week: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBooking {
  id: string;
  client_id: string | null;
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  time_slot_id: string;
  duration_value: number;
  duration_unit: "days" | "weeks" | "months";
  start_date: string;
  end_date: string | null;
  ad_video_url: string | null;
  request_ad_creation: boolean;
  ad_notes: string | null;
  pricing_tier: string;
  total_price: number;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: "pending_payment" | "pending_review" | "approved" | "live" | "completed" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface DbImpression {
  id: string;
  ad_id: string;
  played_at: string;
  duration_seconds: number;
  time_slot_id: string | null;
  day_of_week: number | null;
}

export interface DbQrScan {
  id: string;
  ad_id: string;
  scanned_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: DbClient;
        Insert: Partial<DbClient> & Pick<DbClient, "name" | "business_name">;
        Update: Partial<DbClient>;
        Relationships: [];
      };
      ads: {
        Row: DbAd;
        Insert: Partial<DbAd> & Pick<DbAd, "title">;
        Update: Partial<DbAd>;
        Relationships: [];
      };
      schedule_assignments: {
        Row: DbScheduleAssignment;
        Insert: Partial<DbScheduleAssignment> & Pick<DbScheduleAssignment, "ad_id" | "time_slot_id" | "day_of_week">;
        Update: Partial<DbScheduleAssignment>;
        Relationships: [];
      };
      bookings: {
        Row: DbBooking;
        Insert: Partial<DbBooking> & Pick<DbBooking, "business_name" | "contact_name" | "contact_email" | "time_slot_id" | "start_date" | "pricing_tier">;
        Update: Partial<DbBooking>;
        Relationships: [];
      };
      impressions: {
        Row: DbImpression;
        Insert: Partial<DbImpression> & Pick<DbImpression, "ad_id" | "duration_seconds">;
        Update: Partial<DbImpression>;
        Relationships: [];
      };
      qr_scans: {
        Row: DbQrScan;
        Insert: Partial<DbQrScan> & Pick<DbQrScan, "ad_id">;
        Update: Partial<DbQrScan>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
