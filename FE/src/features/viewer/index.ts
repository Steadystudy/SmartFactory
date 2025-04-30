import dynamic from 'next/dynamic';

const Scene2DViewer = dynamic(() => import('./ui/Scene2DViewer'), {
  ssr: false,
});

const Scene3DViewer = dynamic(() => import('./ui/Scene3DViewer'), {
  ssr: false,
});

export { Scene2DViewer, Scene3DViewer };
