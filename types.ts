
export interface AttendanceRecord {
  id: string;
  full_name: string;
  phone_number: string;
  ward: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  eventType?: 'Friday Gathering' | 'Skills Acquisition' | 'Institute Cluster' | 'Missionary Preparatory Class' | 'Devotional' | 'Missionary Departure' | 'Movie Night';
  skillCategory?: string;
}

export interface WardStats {
  ward: string;
  count: number;
}

export interface MonthlyStats {
  month: string;
  count: number;
}

export interface QuarterlyStats {
  quarter: string;
  count: number;
}

export enum ViewMode {
  USER_FORM = 'USER_FORM',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD'
}
