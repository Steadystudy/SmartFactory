'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import { useModelStore } from '@/shared/model/store';
import { Html } from '@react-three/drei';
import { AMR_CURRENT_STATE } from '@/features/visualization';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { Map3DEnvironment } from '@/entities/map';
import { useAMRAnimation, useCameraFollow, AMR_STATE_COLORS } from '../lib';

// AMR 2D 렌더러 컴포넌트
const AMR2DRenderer = ({ amrInfo }: { amrInfo: AMR_CURRENT_STATE }) => {
  const { state, amrId } = amrInfo;
  const color = AMR_STATE_COLORS[state] || '#9E9E9E';
  const { groupRef } = useAMRAnimation(amrInfo);

  return (
    <group ref={groupRef}>
      {/* AMR 본체 - 방향에 맞게 길쭉한 형태로 변경 */}
      <mesh>
        <boxGeometry args={[1.2, 0.5, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* 방향 표시기 - 본체와 일치하도록 수정 */}
      <group position={[0, 0.3, 0]}>
        {/* 화살표 본체 */}
        <mesh>
          <boxGeometry args={[1, 0.1, 0.2]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* 화살표 머리 */}
        <mesh position={[0.6, 0, 0]}>
          <coneGeometry args={[0.3, 0.6, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>

      {/* AMR ID 표시 */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color='#FFFFFF' />
        <Html position={[0, 0.1, 0]} center>
          <div className='text-xs font-bold text-black'>{amrId}</div>
        </Html>
      </mesh>
    </group>
  );
};

// 2D 맵과 AMR을 포함하는 컴포넌트
const Scene2DContent = () => {
  const { models } = useModelStore();
  const { controlsRef } = useCameraFollow({ is2D: true });

  return (
    <>
      {models.map((amrInfo) => (
        <AMR2DRenderer key={amrInfo.amrId} amrInfo={amrInfo} />
      ))}
      {/* 조명 설정 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 10, 0]} intensity={0.5} />
      {/* 카메라 컨트롤 */}
      <MapControls
        ref={controlsRef}
        enableZoom={true}
        minDistance={40}
        maxDistance={60}
        maxPolarAngle={0}
        minPolarAngle={0}
        enableRotate={false}
      />
    </>
  );
};

// 2D 시각화 컴포넌트
const Scene2DViewer = () => {
  const { reset } = useSelectedAMRStore();

  const handleCanvasClick = (event: React.MouseEvent) => {
    // event.defaultPrevented가 true이면 하위 컴포넌트에서 이벤트를 처리한 것
    if (!event.defaultPrevented) {
      reset();
    }
  };

  return (
    <div className='w-full h-full cursor-grab active:cursor-grabbing' onClick={handleCanvasClick}>
      <Canvas
        camera={{
          position: [0, 50, 0],
        }}
      >
        <Map3DEnvironment />
        <Scene2DContent />
      </Canvas>
    </div>
  );
};

export default Scene2DViewer;
