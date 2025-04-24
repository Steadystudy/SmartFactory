'use client';

export const Map3DEnvironment = () => {
  return (
    <>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color='#f0f0f0' />
      </mesh>

      {/* 조명 설정 */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
};
