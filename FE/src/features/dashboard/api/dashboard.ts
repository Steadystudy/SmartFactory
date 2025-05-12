import { ProductionOverviewData, StatsCardProps } from '../model/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_SERVER;

export async function getDashboardStats(): Promise<StatsCardProps> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/status/factory`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    return await response.json();

  } catch (err) {
    console.error('[getDashboardStats] API 호출 실패:', err);
    throw err;
  }
}

export async function getDashboardChart(): Promise<ProductionOverviewData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/status/production`);
    if (!response.ok) {
      throw new Error('Failed to fetch production data');
    }

    const result = await response.json();

    const timestamps: string[] = [];
    const production: number[] = [];
    const target: number[] = [];

    result.data.forEach((entry: { timestamp: number; production: number; target: number }) => {
      timestamps.push(entry.timestamp.toString().padStart(2, '0'));
      production.push(entry.production);
      target.push(entry.target);
    });

    return { timestamps, production, target };

  } catch (err) {
    console.error('[getDashboardChart] API 호출 실패:', err);
    throw err;
  }
}