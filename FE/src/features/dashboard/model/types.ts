export interface StatData {
  current: number;
  total: number;
  status?: { label: string; value: number }[];
  timeData?: { time: string; value: number }[];
}

export interface StatsCardProps {
  title: string;
  value: string;
  subtext: string[];
  data: StatData;
}

export interface DashboardData {
  title: string;
  value: string;
  subtext: string[];
  data: StatData;
}
