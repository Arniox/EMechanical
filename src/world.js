// src/world.js
import * as THREE from 'three';
import { OrbitControls } from "/three/addons/controls/OrbitControls.js";
import { TransformControls } from "/three/addons/controls/TransformControls.js";
import {
  updateAllMembers,
  removeSelectionOutline
} from './objects.js';

let controls = null;
let transformControls = null;
let isIntersectingTransformControls = false;

// --- Setup Functions ---
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
    new THREE.Vector3(halfSize, -halfSize, -halfSize),
    new THREE.Vector3(halfSize, halfSize, -halfSize),
    new THREE.Vector3(-halfSize, halfSize, -halfSize),
    new THREE.Vector3(-halfSize, -halfSize, halfSize),
    new THREE.Vector3(halfSize, -halfSize, halfSize),
    new THREE.Vector3(halfSize, halfSize, halfSize),
    new THREE.Vector3(-halfSize, halfSize, halfSize)
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
  document.getElementById("showGrid").addEventListener("change", (e) => {
    gridHelper.visible = e.target.checked;
  });
}
export function setupCamera(container) {
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(1.2, 1.2, 1.8); // Closer view
  camera.lookAt(0, 0, 0); // Ensure it looks at the center
  return camera;
}
export function setupRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  return renderer;
}
export function setupControls(camera, renderer) {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0); // Explicitly set target to origin
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = true;
  controls.minDistance = 0.5;
  controls.maxDistance = 10;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.ROTATE,
  };

  const resetView = () => {
    camera.position.set(1.2, 1.2, 1.8);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  document.getElementById("resetView").addEventListener("click", resetView);
}
export function setupTransformControls(scene, camera, renderer) {
  transformControls = new TransformControls(
    camera,
    renderer.domElement
  );
  scene.add(transformControls.getHelper());
  transformControls.setMode("translate");
  transformControls.setSize(0.5); // Increase gizmo size so it's more visible

  // Disable OrbitControls when TransformControls is active.
  transformControls.addEventListener("mouseDown", () => {
    controls.enabled = false;
    isIntersectingTransformControls = true;
  });
  transformControls.addEventListener("mouseUp", () => {
    controls.enabled = true;
  });
  transformControls.addEventListener("objectChange", () => {
    updateAllMembers();
  });
}

// --- Handlers ---
export function clearMovementSelection(selectedNode) {
  if (selectedNode) {
    removeSelectionOutline(selectedNode);
    transformControls.detach();
  }
  return null;
}
export function clearConnectionSelection(connectionNodes) {
  connectionNodes.forEach(node => removeSelectionOutline(node));
  document.getElementById('addMember').disabled = true;
  return [];
}
export function attachGizmoToNode(selectedNode) {
  if (selectedNode) {
    transformControls.attach(selectedNode);
  } else {
    transformControls.detach();
  }
}
export function gizmoIntersecting() {
  return isIntersectingTransformControls;
}
export function setGizmoIntersecting(value) {
  isIntersectingTransformControls = value;
}

// --- For Render Loop ---
export function updateTransformControls() {
  transformControls.update(); // Ensure gizmo updates
}
export function updateControls() {
  controls.update();
}