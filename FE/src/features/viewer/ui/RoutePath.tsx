import { Line } from '@react-three/drei';
import * as THREE from 'three';

export interface Route {
  submissionId: number;
  submissionX: number;
  submissionY: number;
}

interface RoutePathProps {
  points: Route[];
}

// RoutePath 컴포넌트: Route 배열을 받아 3D 선과 화살표, 색상 그라데이션 렌더링
export const RoutePath = ({ points }: RoutePathProps) => {
  if (!points || points.length < 1) return null;
  // 3D 좌표 배열 생성 (Y축 고정)
  const positions: [number, number, number][] = points.map((p) => [
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
