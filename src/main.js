// src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { startAnimationLoop, handleResize } from './render.js';
import { 
    createNode, 
    createMember, 
    deleteNode, 
    updateAllMembers, 
    nodes, 
    setScene 
} from './objects.js';

// --- DOM Container ---
export const container = document.getElementById('canvasContainer');
if (!container) {
    throw new Error('Could not find canvas container element!');
}

//#region Scene & Renderer Setup
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333); // Dark Gray

// Set the scene in objects.js
setScene(scene);

// --- Camera Setup ---
export const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
camera.position.set(1.2, 1.2, 1.8); // Closer view
camera.lookAt(0, 0, 0);             // Ensure it looks at the center

// --- Renderer Setup ---
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
//#endregion

//#region Lighting & World Setup
// --- Lighting ---
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

// Add a softer fill light from the opposite direction
const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 2, -7.5);
scene.add(fillLight);

// --- World Cube & Grid ---
const worldSize = 1.0;
const halfSize = worldSize / 2;
const vertices = [
    new THREE.Vector3(-halfSize, -halfSize, -halfSize), // 0: ---
    new THREE.Vector3( halfSize, -halfSize, -halfSize), // 1: +--
    new THREE.Vector3( halfSize,  halfSize, -halfSize), // 2: ++-
    new THREE.Vector3(-halfSize,  halfSize, -halfSize), // 3: -+-
    new THREE.Vector3(-halfSize, -halfSize,  halfSize), // 4: --+
    new THREE.Vector3( halfSize, -halfSize,  halfSize), // 5: +-+
    new THREE.Vector3( halfSize,  halfSize,  halfSize), // 6: +++
    new THREE.Vector3(-halfSize,  halfSize,  halfSize)  // 7: -++
];
const materialX = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red for X
const materialY = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Green for Y
const materialZ = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Blue for Z

export const worldCubeGroup = new THREE.Group();
function createLine(v1, v2, material) {
    const geometry = new THREE.BufferGeometry().setFromPoints([v1, v2]);
    return new THREE.Line(geometry, material);
}

// Edges parallel to X axis (Red)
worldCubeGroup.add(createLine(vertices[0], vertices[1], materialX));
worldCubeGroup.add(createLine(vertices[3], vertices[2], materialX));
worldCubeGroup.add(createLine(vertices[4], vertices[5], materialX));
worldCubeGroup.add(createLine(vertices[7], vertices[6], materialX));
// Edges parallel to Y axis (Green)
worldCubeGroup.add(createLine(vertices[0], vertices[3], materialY));
worldCubeGroup.add(createLine(vertices[1], vertices[2], materialY));
worldCubeGroup.add(createLine(vertices[4], vertices[7], materialY));
worldCubeGroup.add(createLine(vertices[5], vertices[6], materialY));
// Edges parallel to Z axis (Blue)
worldCubeGroup.add(createLine(vertices[0], vertices[4], materialZ));
worldCubeGroup.add(createLine(vertices[1], vertices[5], materialZ));
worldCubeGroup.add(createLine(vertices[2], vertices[6], materialZ));
worldCubeGroup.add(createLine(vertices[3], vertices[7], materialZ));
scene.add(worldCubeGroup);

export const gridHelper = new THREE.GridHelper(1, 10, 0x888888, 0x444444);
scene.add(gridHelper);
//#endregion

//#region Controls
export const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0); // Explicitly set target to origin
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 0.5;
controls.maxDistance = 10;
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.ROTATE
};

function resetView() {
    camera.position.set(1.2, 1.2, 1.8);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}
document.getElementById('resetView').addEventListener('click', resetView);
document.getElementById('showGrid').addEventListener('change', (e) => {
    gridHelper.visible = e.target.checked;
});
//#endregion

//#region Object Interaction & Selection
// For movement (single selection) and multi-selection (for connecting)
let selectedNode = null;      // For movement mode.
let connectionNodes = [];     // For multi-select connection mode (via Ctrl‑click).

export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();

// Set up TransformControls for moving nodes.
let transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);
transformControls.setMode("translate");
transformControls.addEventListener('objectChange', () => {
    updateAllMembers();
});

// --- Helper functions for selection outlines ---
function addSelectionOutline(node) {
    removeSelectionOutline(node);
    const outlineGeom = node.geometry.clone();
    const outlineMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    const outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
    outlineMesh.position.copy(node.position);
    outlineMesh.rotation.copy(node.rotation);
    outlineMesh.scale.copy(node.scale).multiplyScalar(1.1);
    node.userData.selectionOutline = outlineMesh;
    scene.add(outlineMesh);
}

function removeSelectionOutline(node) {
    if (node.userData.selectionOutline) {
        scene.remove(node.userData.selectionOutline);
        delete node.userData.selectionOutline;
    }
}

function clearMovementSelection() {
    if (selectedNode) {
        removeSelectionOutline(selectedNode);
        selectedNode = null;
        transformControls.detach();
    }
}

function clearConnectionSelection() {
    connectionNodes.forEach(node => removeSelectionOutline(node));
    connectionNodes = [];
    // Disable Connect button if no multi-selection.
    document.getElementById('addMember').disabled = true;
}

function updateConnectButtonState() {
    // Enable the Connect Nodes button only if exactly 2 nodes are selected.
    document.getElementById('addMember').disabled = (connectionNodes.length !== 2);
}

function updateSelectedObjectInfo(text) {
    const infoElement = document.getElementById('selectedObjectInfo');
    infoElement.textContent = text;
    // For deletion, only allow single selection (movement mode)
    document.getElementById('deleteSelected').disabled = !selectedNode;
}

function onMouseClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodes);
    
    if (intersects.length > 0) {
        const clickedNode = intersects[0].object;
        if (event.ctrlKey) {
            // In multi-select mode for connection.
            // Clear any movement selection.
            clearMovementSelection();
            // If already selected, toggle it off.
            const idx = connectionNodes.indexOf(clickedNode);
            if (idx !== -1) {
                connectionNodes.splice(idx, 1);
                removeSelectionOutline(clickedNode);
            } else {
                // If already two nodes are selected, remove the oldest.
                if (connectionNodes.length >= 2) {
                    const removed = connectionNodes.shift();
                    removeSelectionOutline(removed);
                }
                connectionNodes.push(clickedNode);
                addSelectionOutline(clickedNode);
            }
            updateConnectButtonState();
            updateSelectedObjectInfo(`Selected ${connectionNodes.length} node(s) for connection (Ctrl‑click)`);
        } else {
            // Single-select movement mode.
            clearConnectionSelection();
            clearMovementSelection();
            selectedNode = clickedNode;
            addSelectionOutline(selectedNode);
            transformControls.attach(selectedNode);
            updateSelectedObjectInfo("Selected node for movement");
        }
    } else {
        // Click on empty space clears all selections.
        clearMovementSelection();
        clearConnectionSelection();
        updateSelectedObjectInfo("No object selected");
    }
}
renderer.domElement.addEventListener('click', onMouseClick);

// --- Toolbar Button Listeners ---
document.getElementById('addNode').addEventListener('click', () => {
    const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
    );
    createNode(pos);
});

// Connect Nodes button: create beam if exactly 2 nodes are selected.
document.getElementById('addMember').addEventListener('click', () => {
    if (connectionNodes.length === 2) {
        createMember(connectionNodes[0], connectionNodes[1]);
        clearConnectionSelection();
        updateSelectedObjectInfo("Connected nodes");
    } else {
        alert("Please Ctrl‑click to select exactly 2 nodes to connect.");
    }
});

// Delete button: delete the single movement-selected node.
document.getElementById('deleteSelected').addEventListener('click', () => {
    if (selectedNode) {
        deleteNode(selectedNode);
        clearMovementSelection();
        updateSelectedObjectInfo("No object selected");
    }
});
//#endregion

// --- Animation Loop ---
window.addEventListener('resize', handleResize);
startAnimationLoop();
console.log("Mechanical system modeling setup complete.");