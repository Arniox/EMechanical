// src/world.js
import * as THREE from 'three';

export function setupWorld(scene) {
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 2, -7.5);
  scene.add(fillLight);

  // World Cube
  const worldSize = 1.0;
  const halfSize = worldSize / 2;
  const vertices = [
    new THREE.Vector3(-halfSize, -halfSize, -halfSize),
    new THREE.Vector3( halfSize, -halfSize, -halfSize),
    new THREE.Vector3( halfSize,  halfSize, -halfSize),
    new THREE.Vector3(-halfSize,  halfSize, -halfSize),
    new THREE.Vector3(-halfSize, -halfSize,  halfSize),
    new THREE.Vector3( halfSize, -halfSize,  halfSize),
    new THREE.Vector3( halfSize,  halfSize,  halfSize),
    new THREE.Vector3(-halfSize,  halfSize,  halfSize)
  ];
  const materialX = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const materialY = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const materialZ = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const worldCubeGroup = new THREE.Group();
  function createLine(v1, v2, material) {
    const geometry = new THREE.BufferGeometry().setFromPoints([v1, v2]);
    return new THREE.Line(geometry, material);
  }
  // Create edges for the cube.
  worldCubeGroup.add(createLine(vertices[0], vertices[1], materialX));
  worldCubeGroup.add(createLine(vertices[3], vertices[2], materialX));
  worldCubeGroup.add(createLine(vertices[4], vertices[5], materialX));
  worldCubeGroup.add(createLine(vertices[7], vertices[6], materialX));
  worldCubeGroup.add(createLine(vertices[0], vertices[3], materialY));
  worldCubeGroup.add(createLine(vertices[1], vertices[2], materialY));
  worldCubeGroup.add(createLine(vertices[4], vertices[7], materialY));
  worldCubeGroup.add(createLine(vertices[5], vertices[6], materialY));
  worldCubeGroup.add(createLine(vertices[0], vertices[4], materialZ));
  worldCubeGroup.add(createLine(vertices[1], vertices[5], materialZ));
  worldCubeGroup.add(createLine(vertices[2], vertices[6], materialZ));
  worldCubeGroup.add(createLine(vertices[3], vertices[7], materialZ));
  scene.add(worldCubeGroup);

  // Grid Helper
  const gridHelper = new THREE.GridHelper(1, 10, 0x888888, 0x444444);
  scene.add(gridHelper);
}