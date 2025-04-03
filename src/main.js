// src/main.js
import * as THREE from "three";
import { World } from "./world/world.js";
import { startAnimationLoop, handleResize } from "./render.js";

// --- DOM Container ---
export const container = document.getElementById("canvasContainer");
if (!container) {
    throw new Error("Could not find canvas container element!");
}

// Create a new world instance
export const world = new World();

export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();


let keyState = {}; // For key state tracking
function updateConnectButtonState() {
    document.getElementById('addMember').disabled = world.nodeManager.isOnly2NodesSelected;
}
function updateSelectedObjectInfo(text) {
    const infoElement = document.getElementById('selectedObjectInfo');
    infoElement.textContent = text;
    document.getElementById('deleteSelected').disabled = world.nodeManager.isOnly1NodeSelected;
    const forcePanel = document.getElementById('forceInput');

    // Display properties or not
    if (world.nodeManager.isOnly1NodeSelected) {
        forcePanel.style.display = 'block';

        // Set inputs to current values
        document.getElementById('forceX').value = world.nodeManager.selectedNode(1).force.vector.x;
        document.getElementById('forceY').value = world.nodeManager.selectedNode(1).force.vector.y;
        document.getElementById('forceZ').value = world.nodeManager.selectedNode(1).force.vector.z;
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

    if (intersects.length > 0 || gizmoIntersecting()) {
        // If currently clicking on the transform controls, ignore the click event.
        if (gizmoIntersecting()) {
            setGizmoIntersecting(false);
            return;
        }

        // Get the top-level node (in case the intersection hits a child, like the outline)
        let clickedNode = intersects[0].object;
        for (let n of nodes) {
            if (n === clickedNode || n.children.includes(clickedNode)) {
                clickedNode = n;
                break;
            }
        }
        if (keyState.ControlLeft) {
            // Handle the currently selected node
            attachGizmoToNode(null); // Detach gizmo if Ctrl‑clicking

            // Handle the next clicked node
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
            connectionNodes = clearConnectionSelection(connectionNodes);
            selectedNode = clearMovementSelection(selectedNode);

            // Re-Select everything after clearing all previous selections
            selectedNode = clickedNode;
            connectionNodes.push(selectedNode);
            addSelectionOutline(selectedNode);
            attachGizmoToNode(selectedNode);
            updateSelectedObjectInfo("Selected node for movement");
        }
    } else {
        // Clear selection immediately on single click on empty space
        selectedNode = clearMovementSelection(selectedNode);
        connectionNodes = clearConnectionSelection(connectionNodes);
        updateSelectedObjectInfo("No object selected");
    }
}

// Global Listeners
document.addEventListener('keydown', (event) => {
    keyState[event.code] = true;
    if (keyState.ControlLeft) {
        // Ctrl key pressed
        updateSelectedObjectInfo(`Ready for end node (Ctrl‑click)`);
    }
});

document.addEventListener('keyup', (event) => {
    if (world.nodeManager.isAnySelected && keyState.ControlLeft) {
        // Ctrl key released
        updateSelectedObjectInfo("Selected node for movement");
    }
    else if (keyState.ControlLeft) {
        // Ctrl key released without selecting a node
        updateSelectedObjectInfo("No object selected");
    }
    keyState[event.code] = false;
});

// Specific Listeners
document.getElementById('addNode').addEventListener('click', () => {
    const position = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
    );
    world.nodeManager.createNode(position, world.scene);
});

document.getElementById('addMember').addEventListener('click', () => {
    if (world.nodeManager.isOnly2NodesSelected) {
        world.nodeManager.createBeam(
            world.nodeManager.selectedNode(1),
            world.nodeManager.selectedNode(2),
            world.scene
        );
        updateSelectedObjectInfo("Connected nodes");
    } else {
        updateSelectedObjectInfo("Please Ctrl‑click to select exactly 2 nodes to connect.");
    }
});

document.getElementById('deleteSelected').addEventListener('click', () => {
    if (world.nodeManager.isAnySelected) {
        world.nodeManager.selectedNode(1).delete(world.scene);
        updateSelectedObjectInfo("No object selected");
    }
});

document.getElementById('applyForce').addEventListener('click', () => {
    let xValue = parseFloat(document.getElementById('forceX').value) || 0;
    let yValue = parseFloat(document.getElementById('forceY').value) || 0;
    let zValue = parseFloat(document.getElementById('forceZ').value) || 0;
    // Constrain
    xValue = constrainNumber(xValue, -worldSize, worldSize);
    yValue = constrainNumber(yValue, -worldSize, worldSize);
    zValue = constrainNumber(zValue, -worldSize, worldSize);
    // Update input fields
    document.getElementById('forceX').value = xValue;
    document.getElementById('forceY').value = yValue;
    document.getElementById('forceZ').value = zValue;
    // Set force
    if (selectedNode) {
        applyForceToNode(selectedNode, new THREE.Vector3(xValue, yValue, zValue));
    }
});

document.getElementById("worldSizeInput").addEventListener("input", (event) => {
    const newSize = parseFloat(event.target.value);
    const unit = document.getElementById("unitSelect").value;
    const worldScaleOutput = unit === 'm' ? '' : ` - <span class="unitConversionResult">${stringifiyUnit(getWorldScale())} m</span>`;

    // Set
    document.getElementById("worldSizeValue").innerHTML = `${newSize} ${unit}${worldScaleOutput}`;
    worldSize = newSize; // Update the global world size
});

document.getElementById("unitSelect").addEventListener("change", (event) => {
    const newSize = parseFloat(document.getElementById("worldSizeInput").value);
    const unit = event.target.value;
    const worldScaleOutput = unit === 'm' ? '' : ` - <span class="unitConversionResult">${stringifiyUnit(getWorldScale())} m</span>`;

    // Set
    document.getElementById("worldSizeValue").innerHTML = `${newSize} ${unit}${worldScaleOutput}`;
    worldSize = newSize; // Update the global world size
});

window.addEventListener('resize', handleResize);
startAnimationLoop();
console.log("Mechanical system modeling setup complete.");