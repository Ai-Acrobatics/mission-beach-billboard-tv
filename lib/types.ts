export interface Ad {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  durationSeconds: number;
  active: boolean;
  priority: "standard" | "premium" | "takeover";
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  name: string;
  startHour: number; // 0-23
  endHour: number; // 0-23
  label: string; // e.g. "Morning (6AM-10AM)"
}

export interface Schedule {
  id: string;
  adId: string;
  timeSlotId: string;
  daysOfWeek: number[]; // 0=Sun, 6=Sat
  active: boolean;
  startDate: string;
  endDate: string;
}

export interface ScheduledAd extends Ad {
  schedule: Schedule;
  timeSlot: TimeSlot;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  createdAt: string;
}

export interface PricingTier {
  name: string;
  price: number;
  unit: string;
  features: string[];
  popular?: boolean;
}

export type DayPeriod = "morning" | "midday" | "evening" | "night";
