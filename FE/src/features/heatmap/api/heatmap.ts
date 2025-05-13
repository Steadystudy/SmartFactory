import { HeatmapPoint } from '@/shared/store/heatmap-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_SERVER;

export const fetchHeatmapData = async (): Promise<HeatmapPoint[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/status/heatmap`);
    console.log(response);
    if (!response.ok) {
      throw new Error('Failed to fetch heatmap data');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return [];
  }
}; 