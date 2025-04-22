'use client';

import { useEffect, useRef } from 'react';

const Heatmap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 가상의 히트맵 데이터 (실제로는 API에서 받아와야 함)
    const generateHeatmapData = () => {
      const data: number[][] = [];
      const gridSize = 20;
      for (let i = 0; i < gridSize; i++) {
        data[i] = [];
        for (let j = 0; j < gridSize; j++) {
          // 랜덤한 히트맵 값 생성 (0-1 사이)
          data[i][j] = Math.random();
        }
      }
      return data;
    };

    // 히트맵 그리기
    const drawHeatmap = () => {
      if (!ctx) return;

      const data = generateHeatmapData();
      const cellWidth = canvas.width / data.length;
      const cellHeight = canvas.height / data[0].length;

      data.forEach((row, i) => {
        row.forEach((value, j) => {
          // 값에 따른 색상 계산 (파란색 -> 빨간색)
          const hue = ((1 - value) * 240).toString(10);
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
          ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
        });
      });

      // 격자 그리기
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      data.forEach((_, i) => {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, canvas.height);
        ctx.stroke();
      });
      data[0].forEach((_, j) => {
        ctx.beginPath();
        ctx.moveTo(0, j * cellHeight);
        ctx.lineTo(canvas.width, j * cellHeight);
        ctx.stroke();
      });
    };

    drawHeatmap();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className='relative h-full w-full'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 right-4 bg-white p-2 rounded shadow'>
        <div className='flex items-center gap-2'>
          <div className='text-sm'>낮음</div>
          <div className='w-32 h-4 bg-gradient-to-r from-blue-500 to-red-500' />
          <div className='text-sm'>높음</div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
