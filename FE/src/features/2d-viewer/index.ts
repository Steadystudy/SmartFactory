import dynamic from 'next/dynamic';

const Scene2DViewer = dynamic(() => import('./ui/Scene2DViewer'), {
  ssr: false,
});

export default Scene2DViewer;
