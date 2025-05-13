'use client';

import { useEffect } from 'react';
import { useHeatmapStore } from '@/shared/store/heatmap-store';
import { fetchHeatmapData } from '@/features/heatmap/api/heatmap';

export const HeatmapController = () => {
  const { setHeatmapData } = useHeatmapStore();

  useEffect(() => {
    const loadHeatmapData = async () => {
      const data = await fetchHeatmapData();
      setHeatmapData(data);
    };
    loadHeatmapData();
  }, [setHeatmapData]);

  return null;
}; 