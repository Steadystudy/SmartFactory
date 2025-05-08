import { StatsCardProps } from '../model/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_SERVER;

export async function getDashboardStats(): Promise<StatsCardProps> {
  const response = await fetch(`${API_BASE_URL}/api/v1/status/factory`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
}

export async function getDashboardChart() {
  const response = await fetch('http://localhost:3000/api/dashboard/chart');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard chart data');
  }
  return response.json();
}
