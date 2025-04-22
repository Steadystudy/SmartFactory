import { DashboardData } from '../model/types';

export async function getDashboardStats(): Promise<DashboardData[]> {
  const response = await fetch('http://localhost:3000/api/dashboard/stats');
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
