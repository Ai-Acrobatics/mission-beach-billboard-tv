export interface Ad {
  id: string;
  clientId: string;
  title: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  durationSeconds: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  adId: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[]; // 0=Sun, 6=Sat
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}
