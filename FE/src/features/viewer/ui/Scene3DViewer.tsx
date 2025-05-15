'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Map3D, MapLoading } from '@/entities/map';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { Model3DRenderer } from '@/entities/amrModel';
import { useCameraFollow } from '../lib';
import { MapPointer } from '@/entities/3dPointer';
import { RoutePath, Route } from './RoutePath';
import { useAmrSocketStore } from '@/shared/store/amrSocket';
import { useModelStore } from '@/shared/model/store';

const Warehouse = () => {
  const { selectedAmrId, startX, startY, targetX, targetY } = useSelectedAMRStore();
  const { controlsRef } = useCameraFollow();
  const [route, setRoute] = useState<Route[]>([]);
  const { amrSocket, isConnected } = useAmrSocketStore();
  const urlRef = useRef<string>('');
  const { getSelectedModel } = useModelStore();

  useEffect(() => {
    if (!amrSocket || !isConnected) return;
    const destination = `/app/amr/route/${selectedAmrId}`;

    if (urlRef.current !== destination) {
      // 이전 구독 취소
      amrSocket.publish({
        destination: urlRef.current + '/unsubscribe',
      });
      amrSocket.unsubscribe(urlRef.current);

      // 새로운 구독
      amrSocket.publish({
        destination,
      });

      amrSocket.subscribe(`/amr/route/${selectedAmrId}`, (data) => {
        const route = JSON.parse(data.body);
        const amr = getSelectedModel(selectedAmrId);
        setRoute([
          { submissionId: -1, submissionX: amr?.locationX, submissionY: amr?.locationY },
          ...route.missionStatusList,
        ]);
      });

      urlRef.current = destination;
    }
  }, [selectedAmrId, amrSocket, isConnected]);

  return (
    <>
      {/* 모델 렌더링 */}
      <Model3DRenderer />

      {/* 출발지 표시 (파란색 구체) */}
      {selectedAmrId && <MapPointer position={[startX!, 3, startY!]} color='Blue' />}

      {/* 도착지 표시 (빨간색 구체) */}
      {selectedAmrId && <MapPointer position={[targetX!, 3, targetY!]} color='Red' />}

      {/* Route 경로 시각화 */}
      <RoutePath points={route} />

      <MapControls
        ref={controlsRef}
        enableZoom={true}
        minDistance={20}
        maxDistance={80}
        autoRotate={false}
        maxPolarAngle={Math.PI / 4}
        minPolarAngle={Math.PI / 4}
        target={[40, 0, 40]}
      />
    </>
  );
};

const Scene3DViewer = () => {
  return (
    <>
      <MapLoading />
      <Suspense fallback={null}>
        <Canvas camera={{ position: [60, 50, 60], fov: 60 }}>
          <Map3D />
          <Warehouse />
        </Canvas>
      </Suspense>
    </>
  );
};

export default Scene3DViewer;
