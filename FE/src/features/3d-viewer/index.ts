import dynamic from 'next/dynamic';

const Scene3DViewer = dynamic(() => import('./ui/Scene3DViewer'), {
  ssr: false,
});

export default Scene3DViewer;
