'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useModelStore } from '@/shared/model/store';
import { Map2D } from '@/entities/map/2d/ui/Map2D';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp3 } from 'maath/easing';
import { Html } from '@react-three/drei';
import { AMR_CURRENT_STATE } from '@/features/visualization';

// AMR 상태에 따른 색상 매핑
const AMR_STATE_COLORS: Record<number, string> = {
  0: '#F44336', // ERROR - 빨간색
  1: '#4CAF50', // IDLE - 녹색
  2: '#2196F3', // PROCESSING - 파란색
  3: '#FFC107', // CHARGING - 노란색
};

const DAMPING_FACTOR = 0.15; // 감쇠 계수 (값이 작을수록 더 부드럽게 이동)

// AMR 2D 렌더러 컴포넌트
const AMR2DRenderer = ({ amrInfo }: { amrInfo: AMR_CURRENT_STATE }) => {
  const { state, locationX, locationY, dir, amrId } = amrInfo;
  const color = AMR_STATE_COLORS[state] || '#9E9E9E'; // 기본 회색

  // 현재 위치와 회전을 저장하는 ref
  const groupRef = useRef<THREE.Group>(null);
  const currentPosition = useRef(new THREE.Vector3(locationX, 0, locationY));
  const currentRotation = useRef(new THREE.Euler(0, dir, 0));

  // 매 프레임마다 위치와 회전을 부드럽게 업데이트
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // 목표 위치로 부드럽게 이동
    damp3(currentPosition.current, [locationX, 0, locationY], DAMPING_FACTOR, delta);

    // 현재 위치 적용
    groupRef.current.position.copy(currentPosition.current);

    // 회전 보간
    const targetRotation = new THREE.Euler(0, dir, 0);
    currentRotation.current.x = THREE.MathUtils.damp(
      currentRotation.current.x,
      targetRotation.x,
      DAMPING_FACTOR,
      delta,
    );
    currentRotation.current.y = THREE.MathUtils.damp(
      currentRotation.current.y,
      targetRotation.y,
      DAMPING_FACTOR,
      delta,
    );
    currentRotation.current.z = THREE.MathUtils.damp(
      currentRotation.current.z,
      targetRotation.z,
      DAMPING_FACTOR,
      delta,
    );

    // 현재 회전 적용
    groupRef.current.rotation.copy(currentRotation.current);
  });

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

  return (
    <>
      <Map2D />
      {models.map((amrInfo) => (
        <AMR2DRenderer key={amrInfo.amrId} amrInfo={amrInfo} />
      ))}
      {/* 조명 설정 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 10, 0]} intensity={0.5} />
      {/* 카메라 컨트롤 */}
      <OrbitControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        minDistance={10}
        maxDistance={100}
      />
    </>
  );
};

// 2D 시각화 컴포넌트
const Scene2DViewer = () => {
  return (
    <div className='w-full h-full'>
      <Canvas
        camera={{
          position: [0, 50, 0],
          fov: 50,
          near: 0.1,
          far: 1000,
          rotation: [-Math.PI / 2, 0, 0],
        }}
      >
        <Scene2DContent />
      </Canvas>
    </div>
  );
};

export default Scene2DViewer;
