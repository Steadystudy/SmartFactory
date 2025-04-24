'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import { Model3DProps } from '../model/types';
import * as THREE from 'three';
import { damp3, dampE } from 'maath/easing';

const ANIMATION_SETTINGS = {
  rotationDamping: 0.15,
  positionDamping: 0.5,
  rotationThreshold: 0.001,
  positionThreshold: 0.01,
  angleThreshold: 0.1,
  maxAnimationTime: 1.0,
};

export const BaseModel3D = ({
  modelPath,
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: Model3DProps) => {
  const { scene: originalScene } = useGLTF(modelPath);

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

  // 이동 상태 관리
  const isMovingRef = useRef(false);
  const animationPhaseRef = useRef<'rotation' | 'movement'>('rotation');
  const rotationCompletedRef = useRef(false);

  // 위치나 회전이 변경되면 목표값 업데이트
  useEffect(() => {
    targetPosition.current.set(...position);
    targetRotation.current.set(...rotation);

    // 이동 방향 계산
    const direction = new THREE.Vector3().subVectors(
      targetPosition.current,
      currentPosition.current,
    );

    // 목표 회전각 계산
    if (direction.length() > 0.001) {
      const targetAngle = Math.atan2(direction.x, direction.z);

      // 현재 각도와 목표 각도의 차이 계산
      const currentAngle = currentRotation.current.y;
      let angleDiff = targetAngle - currentAngle;

      // 각도 차이를 -PI ~ PI 범위로 정규화
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // 가장 짧은 경로로 회전하기 위해 목표 각도 설정
      targetRotation.current.y = currentAngle + angleDiff;

      // 현재 방향과 목표 방향 사이의 각도 차이 계산
      const currentDirection = new THREE.Vector3(0, 0, 1).applyEuler(currentRotation.current);
      const angleDiffToTarget = currentDirection.angleTo(direction);

      // 각도 차이가 임계값보다 작으면 직선 이동 가능
      isMovingRef.current = Math.abs(angleDiffToTarget) < ANIMATION_SETTINGS.angleThreshold;
    }

    // 이전 값 저장
    currentPosition.current.copy(currentPosition.current);
    currentRotation.current.copy(currentRotation.current);

    // 애니메이션 시작 시간 기록
    animationPhaseRef.current = 'rotation';
    rotationCompletedRef.current = false;
  }, [position, rotation]);

  useFrame((state, delta) => {
    if (!modelRef.current) return;

    // 회전 단계
    if (animationPhaseRef.current === 'rotation') {
      // 회전이 필요한 경우
      dampE(
        currentRotation.current,
        [targetRotation.current.x, targetRotation.current.y, targetRotation.current.z],
        ANIMATION_SETTINGS.rotationDamping,
        delta,
      );

      // 회전이 거의 완료되면 이동 시작
      if (
        Math.abs(currentRotation.current.y - targetRotation.current.y) <
        ANIMATION_SETTINGS.rotationThreshold
      ) {
        rotationCompletedRef.current = true;
        animationPhaseRef.current = 'movement';
        isMovingRef.current = true;
      }
    }
    // 이동 단계
    else if (rotationCompletedRef.current) {
      // 직선 이동
      damp3(
        currentPosition.current,
        targetPosition.current,
        ANIMATION_SETTINGS.positionDamping,
        delta,
      );

      // 목표 위치에 도달하면 이동 중지
      const distance = currentPosition.current.distanceTo(targetPosition.current);
      if (distance < ANIMATION_SETTINGS.positionThreshold) {
        isMovingRef.current = false;
      }
    }

    // 모델에 현재 위치와 회전 적용
    modelRef.current.position.copy(currentPosition.current);
    modelRef.current.rotation.copy(currentRotation.current);
  });

  return <primitive ref={modelRef} object={scene} scale={scale} />;
};
