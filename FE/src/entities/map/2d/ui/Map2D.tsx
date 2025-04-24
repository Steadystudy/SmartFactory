'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const MAP_SIZE = 80;
const GRID_SIZE = 1;
const GRID_COLOR = '#e0e0e0';
const WALL_COLOR = '#808080';

export const Map2D = () => {
  const gridRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    // 그리드 라인 생성
    for (let i = -MAP_SIZE / 2; i <= MAP_SIZE / 2; i += GRID_SIZE) {
      // X축 그리드 라인
      const xLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(i, 0, -MAP_SIZE / 2),
          new THREE.Vector3(i, 0, MAP_SIZE / 2),
        ]),
        new THREE.LineBasicMaterial({ color: GRID_COLOR }),
      );
      gridRef.current.add(xLine);

      // Z축 그리드 라인
      const zLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-MAP_SIZE / 2, 0, i),
          new THREE.Vector3(MAP_SIZE / 2, 0, i),
        ]),
        new THREE.LineBasicMaterial({ color: GRID_COLOR }),
      );
      gridRef.current.add(zLine);
    }

    // 벽 생성
    const wallGeometry = new THREE.BoxGeometry(MAP_SIZE, 1, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: WALL_COLOR });

    // 북쪽 벽
    const northWall = new THREE.Mesh(wallGeometry, wallMaterial);
    northWall.position.set(0, 0, MAP_SIZE / 2);
    gridRef.current.add(northWall);

    // 남쪽 벽
    const southWall = new THREE.Mesh(wallGeometry, wallMaterial);
    southWall.position.set(0, 0, -MAP_SIZE / 2);
    gridRef.current.add(southWall);

    // 동쪽 벽
    const eastWall = new THREE.Mesh(wallGeometry, wallMaterial);
    eastWall.rotation.y = Math.PI / 2;
    eastWall.position.set(MAP_SIZE / 2, 0, 0);
    gridRef.current.add(eastWall);

    // 서쪽 벽
    const westWall = new THREE.Mesh(wallGeometry, wallMaterial);
    westWall.rotation.y = Math.PI / 2;
    westWall.position.set(-MAP_SIZE / 2, 0, 0);
    gridRef.current.add(westWall);

    return () => {
      gridRef.current?.clear();
    };
  }, []);

  return <group ref={gridRef} />;
};
