import { useModelStore } from '@/shared/model/store';
import { useAmrSocketStore } from '@/shared/store/amrSocket';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { Line } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { toast } from 'sonner';

export interface Route {
  submissionId: number;
  submissionX: number;
  submissionY: number;
}

// RoutePath 컴포넌트: Route 배열을 받아 3D 선과 화살표, 색상 그라데이션 렌더링
export const RoutePath = () => {
  const [route, setRoute] = useState<[number, number, number][]>([]);
  const { selectedAmrId, startX, startY, targetX, targetY } = useSelectedAMRStore();
  const { amrSocket, isConnected } = useAmrSocketStore();
  const urlRef = useRef<string>('');
  const { getSelectedModel } = useModelStore();

  // 출발지/도착지 변경 감지 및 toast
  const prevRef = useRef({ selectedAmrId, startX, startY, targetX, targetY });
  useEffect(() => {
    if (
      prevRef.current.selectedAmrId === selectedAmrId &&
      (prevRef.current.startX !== startX ||
        prevRef.current.startY !== startY ||
        prevRef.current.targetX !== targetX ||
        prevRef.current.targetY !== targetY)
    ) {
      toast('경로가 변경되었습니다.');
    }
    prevRef.current = { selectedAmrId, startX, startY, targetX, targetY };
  }, [selectedAmrId, startX, startY, targetX, targetY]);

  useEffect(() => {
    if (!amrSocket || !isConnected) return;
    const destination = `/app/amr/route/${selectedAmrId}`;
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
      const routeData = JSON.parse(data.body);
      const amr = getSelectedModel(selectedAmrId);
      setRoute([
        [amr?.locationX, 0.11, amr?.locationY],
        ...routeData.missionStatusList.map((p: Route) => [p.submissionX, 0.11, p.submissionY]),
      ]);
    });

    urlRef.current = destination;

    return () => {
      amrSocket.publish({
        destination: urlRef.current + '/unsubscribe',
      });
      amrSocket.unsubscribe(urlRef.current);
      urlRef.current = '';
      setRoute([]);
    };
  }, [selectedAmrId, amrSocket, isConnected, getSelectedModel]);

  if (!route || route.length < 1) return null;

  return (
    <>
      {/* 선(Line) - 두께, 색상 고정 */}
      <Line points={route} color='white' lineWidth={5} dashed={false} />
      {/* 각 구간마다 화살표 - 크기 일정, 색상 고정 */}
      {route.slice(0, -1).map((start, i) => {
        const end = route[i + 1];
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
