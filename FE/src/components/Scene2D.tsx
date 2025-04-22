'use client';

import { useEffect, useRef } from 'react';

const Scene2D = () => {
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

    // 창고 레이아웃 그리기
    const drawWarehouse = () => {
      if (!ctx) return;

      // 배경
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 격자 그리기
      ctx.strokeStyle = '#ddd';
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 선반 그리기
      ctx.fillStyle = '#8b4513';
      const shelfWidth = 100;
      const shelfHeight = 50;
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(
          canvas.width / 4 + i * (shelfWidth + 50),
          canvas.height / 3,
          shelfWidth,
          shelfHeight,
        );
      }

      // AMR 그리기
      ctx.fillStyle = 'orange';
      ctx.fillRect(canvas.width / 2 - 25, canvas.height / 2 - 25, 50, 50);
    };

    drawWarehouse();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className='w-full h-full' />;
};

export default Scene2D;
