// src/main.js
import * as THREE from "three";
import { OrbitControls } from "/three/addons/controls/OrbitControls.js";
import { TransformControls } from "/three/addons/controls/TransformControls.js";

import { startAnimationLoop, handleResize } from "./render.js";
import {
    createNode,
    createMember,
    deleteNode,
    updateAllMembers,
    nodes,
    setScene,
} from "./objects.js";
import { setupWorld } from "./world.js";

// --- DOM Container ---
export const container = document.getElementById("canvasContainer");
if (!container) {
    throw new Error("Could not find canvas container element!");
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
camera.lookAt(0, 0, 0); // Ensure it looks at the center

// --- Renderer Setup ---
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
//#endregion

// Call our world setup function.
setupWorld(scene);

//#region Controls
export const controls = new OrbitControls(camera, renderer.domElement);
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

function resetView() {
    camera.position.set(1.2, 1.2, 1.8);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}
document.getElementById("resetView").addEventListener("click", resetView);
document.getElementById("showGrid").addEventListener("change", (e) => {
    gridHelper.visible = e.target.checked;
});
//#endregion

//#region Object Interaction & Selection
let selectedNode = null; // For movement mode.
let connectionNodes = []; // For multi-select connection mode (via Ctrl‑click).

export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();

// Set up TransformControls for moving nodes.
export let transformControls = new TransformControls(
    camera,
    renderer.domElement
);
scene.add(transformControls.getHelper());
transformControls.setMode("translate");

// Transform Controller Helper
const helper = transformControls.getHelper();
helper.traverse(child => {
    child.layers.set(1); // Move helper to layer 1
});
camera.layers.enable(0);  // Ensure camera still renders layer 0 (for your nodes)
raycaster.layers.set(0);   // Raycast only on layer 0

// Sizing and event handling
transformControls.setSize(0.5); // Increase gizmo size so it's more visible
// Disable OrbitControls when TransformControls is active.
transformControls.addEventListener("mouseDown", () => {
    controls.enabled = false;
});
transformControls.addEventListener("mouseUp", () => {
    controls.enabled = true;
});
transformControls.addEventListener("objectChange", () => {
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
        opacity: 0.4,
    });
    const outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
    outlineMesh.position.set(0, 0, 0);  // relative to node
    outlineMesh.rotation.set(0, 0, 0);
    outlineMesh.scale.copy(node.scale).multiplyScalar(1.1);
    node.add(outlineMesh); // attach as child
    node.userData.selectionOutline = outlineMesh;
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
    document.getElementById('addMember').disabled = true;
}

function updateConnectButtonState() {
    document.getElementById('addMember').disabled = (connectionNodes.length !== 2);
}

function updateSelectedObjectInfo(text) {
    const infoElement = document.getElementById('selectedObjectInfo');
    infoElement.textContent = text;
    document.getElementById('deleteSelected').disabled = !selectedNode;
    const forcePanel = document.getElementById('forceInput');
    if (selectedNode && connectionNodes.length === 0) {
        forcePanel.style.display = 'block';
        if (selectedNode.userData.forces) {
            document.getElementById('forceX').value = selectedNode.userData.forces.x;
            document.getElementById('forceY').value = selectedNode.userData.forces.y;
            document.getElementById('forceZ').value = selectedNode.userData.forces.z;
        } else {
            document.getElementById('forceX').value = 0;
            document.getElementById('forceY').value = 0;
            document.getElementById('forceZ').value = 0;
        }
    } else {
        forcePanel.style.display = 'none';
    }
}

function onMouseClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodes, true);

    if (intersects.length > 0) {
        // Get the top-level node (in case the intersection hits a child, like the outline)
        let clickedNode = intersects[0].object;
        for (let n of nodes) {
            if (n === clickedNode || n.children.includes(clickedNode)) {
                clickedNode = n;
                break;
            }
        }
        if (event.ctrlKey) {
            clearMovementSelection();
            const idx = connectionNodes.indexOf(clickedNode);
            if (idx !== -1) {
                connectionNodes.splice(idx, 1);
                removeSelectionOutline(clickedNode);
            } else {
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
            clearConnectionSelection();
            clearMovementSelection();
            selectedNode = clickedNode;
            addSelectionOutline(selectedNode);
            transformControls.attach(selectedNode);
            updateSelectedObjectInfo("Selected node for movement");
        }
    } else {
        // Clear selection immediately on single click on empty space
        clearMovementSelection();
        clearConnectionSelection();
        updateSelectedObjectInfo("No object selected");
    }
}
renderer.domElement.addEventListener('click', onMouseClick);

// Toolbar Button Listeners
document.getElementById('addNode').addEventListener('click', () => {
    const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
    );
    createNode(pos);
});

document.getElementById('addMember').addEventListener('click', () => {
    if (connectionNodes.length === 2) {
        createMember(connectionNodes[0], connectionNodes[1]);
        clearConnectionSelection();
        updateSelectedObjectInfo("Connected nodes");
    } else {
        alert("Please Ctrl‑click to select exactly 2 nodes to connect.");
    }
});

document.getElementById('deleteSelected').addEventListener('click', () => {
    if (selectedNode) {
        deleteNode(selectedNode);
        clearMovementSelection();
        updateSelectedObjectInfo("No object selected");
    }
});

document.getElementById('applyForce').addEventListener('click', () => {
    if (selectedNode) {
        const fx = parseFloat(document.getElementById('forceX').value) || 0;
        const fy = parseFloat(document.getElementById('forceY').value) || 0;
        const fz = parseFloat(document.getElementById('forceZ').value) || 0;
        // Call your force function from computation.js if needed:
        // applyForceToNode(selectedNode, new THREE.Vector3(fx, fy, fz));
    }
});
//#endregion

window.addEventListener('resize', handleResize);
startAnimationLoop();
console.log("Mechanical system modeling setup complete.");
