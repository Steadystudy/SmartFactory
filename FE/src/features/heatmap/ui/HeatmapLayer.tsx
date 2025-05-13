import { useHeatmapStore } from '@/shared/store/heatmap-store';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function getHeatmapColor(intensity: number) {
  return `rgba(255,0,0,${intensity})`;
}

export const HeatmapLayer = () => {
  const { heatmapData } = useHeatmapStore();
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const width = 800;
    const height = 800;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    // 최대 count 구하기 (0 division 방지) - 추후 수정할지도
    const maxCount = Math.max(1, ...heatmapData.map(p => p.count));

    heatmapData.forEach(({ x, y, count }) => {
      const intensity = count / maxCount;
      const radius = 60; 
      const cx = (x / 80) * width;
      const cy = (y / 80) * height;
      const color = getHeatmapColor(intensity);
      const rgb = color.match(/rgba\((\d+),(\d+),(\d+),/);
      const transparentColor = rgb
        ? `rgba(${rgb[1]},${rgb[2]},${rgb[3]},0)`
        : 'rgba(255,255,255,0)';
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(1, transparentColor);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    const tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [heatmapData]);

  return (
    <mesh ref={meshRef} position={[40, 0.11, 40]} rotation={[-Math.PI / 2, 0, 0]} scale={[80, 80, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={0.7} />
    </mesh>
  );
}; 