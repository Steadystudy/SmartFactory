'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import { Model3DProps } from '../model/types';
import * as THREE from 'three';
import { damp3, dampE } from 'maath/easing';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';

const ANIMATION_SETTINGS = {
  rotationDamping: 0.1,
  positionDamping: 0.1,
};

export const BaseModel3D = ({
  modelPath,
  position,
  scale = 1,
  rotation,
  modelId,
  onClick,
}: Model3DProps) => {
  const { scene: originalScene } = useGLTF(modelPath);
  const { selectedAmrId, setSelectedAmrId } = useSelectedAMRStore();
  const { gl } = useThree();

  // 바깥 클릭 이벤트 핸들러 추가
  useEffect(() => {
    const handleBackgroundClick = (event: MouseEvent) => {
      // 배경 클릭 시 selectedAmrId를 null로 설정
      if (event.target === gl.domElement) {
        setSelectedAmrId(null);
      }
    };

    gl.domElement.addEventListener('click', handleBackgroundClick);
    return () => {
      gl.domElement.removeEventListener('click', handleBackgroundClick);
    };
  }, [gl, setSelectedAmrId]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAmrId(modelId);
    onClick?.();
  };

  // 각 인스턴스마다 새로운 scene 클론 생성
  const scene = useMemo(() => {
    const clonedScene = originalScene.clone();
    // material도 클론하여 독립적으로 관리
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone();
      }
    });
    return clonedScene;
  }, [originalScene]);

  const modelRef = useRef<THREE.Group>(null);

  // 현재 위치와 회전 상태 관리
  const currentPosition = useRef(new THREE.Vector3(...position));
  const targetPosition = useRef(new THREE.Vector3(...position));
  const currentRotation = useRef(new THREE.Euler(...rotation));
  const targetRotation = useRef(new THREE.Euler(...rotation));

  // 위치나 회전이 변경되면 목표값 업데이트
  useEffect(() => {
    targetPosition.current.set(...position);
    targetRotation.current.set(...rotation);
  }, [position, rotation]);

  useFrame((state, delta) => {
    if (!modelRef.current) return;

    // 매 프레임마다 회전과 위치를 부드럽게 업데이트
    dampE(
      currentRotation.current,
      targetRotation.current,
      ANIMATION_SETTINGS.rotationDamping,
      delta,
    );

    damp3(
      currentPosition.current,
      targetPosition.current,
      ANIMATION_SETTINGS.positionDamping,
      delta,
    );

    // 모델에 현재 위치와 회전 적용
    modelRef.current.position.copy(currentPosition.current);
    modelRef.current.rotation.copy(currentRotation.current);
  });

  // hover 효과 적용
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (selectedAmrId === modelId) {
          child.material.emissive = new THREE.Color(0x0000ff);
          child.material.emissiveIntensity = 0.2;
          child.material.opacity = 0.9;
        } else {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.emissiveIntensity = 0;
          child.material.opacity = 1;
        }
      }
    });
  }, [selectedAmrId, scene, modelId]);

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={scale}
      className='cursor-pointer'
      onClick={handleClick}
    />
  );
};
