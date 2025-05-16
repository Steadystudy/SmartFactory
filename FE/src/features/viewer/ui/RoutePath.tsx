import { useModelStore } from '@/shared/model/store';
import { useAmrSocketStore } from '@/shared/store/amrSocket';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { Line } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Route {
  submissionId: number;
  submissionX: number;
  submissionY: number;
}

// RoutePath 컴포넌트: Route 배열을 받아 3D 선과 화살표, 색상 그라데이션 렌더링
export const RoutePath = () => {
  const [route, setRoute] = useState<Route[]>([]);
  const { selectedAmrId } = useSelectedAMRStore();
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
    return () => {
      if (urlRef.current) {
        amrSocket.publish({
          destination: urlRef.current + '/unsubscribe',
        });
        amrSocket.unsubscribe(urlRef.current);
        setRoute([]);
      }
    };
  }, [selectedAmrId, amrSocket, isConnected]);

  if (!route || route.length < 1) return null;
  // 3D 좌표 배열 생성 (Y축 고정)
  const positions: [number, number, number][] = route.map((p) => [
    p.submissionX,
    0.11,
    p.submissionY,
  ]);
  return (
    <>
      {/* 선(Line) - 두께, 색상 고정 */}
      <Line points={positions} color='white' lineWidth={5} dashed={false} />
      {/* 각 구간마다 화살표 - 크기 일정, 색상 고정 */}
      {positions.slice(0, -1).map((start, i) => {
        const end = positions[i + 1];
        const dir = new THREE.Vector3(...end).sub(new THREE.Vector3(...start)).normalize();
        const arrowLength = 2;
        const arrowHeadLength = 0.5;
        const arrowHeadWidth = 0.5;
        return (
          <primitive
            key={i}
            object={
              new THREE.ArrowHelper(
                dir,
                new THREE.Vector3(...start),
                arrowLength,
                'white',
                arrowHeadLength,
                arrowHeadWidth,
              )
            }
          />
        );
      })}
    </>
  );
};
