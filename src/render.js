// src/render.js
import { scene, camera, renderer, container } from './main.js';
import { updateControls, updateTransformControls } from './world.js';
import { runComputations } from './computation.js';

// The core animation function
function animate() {
    requestAnimationFrame(animate); // Loop

    // Run computation checks/updates (currently empty)
    updateControls();
    updateTransformControls();
    runComputations();

    // Render the scene
    renderer.render(scene, camera);
}

// Exported function to start the loop
export function startAnimationLoop() {
    animate();
}

// Exported function to handle window resizing
export function handleResize() {
    if (!container) return; // Check if container exists

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Important check: Ensure width and height are not zero
    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    // No need to set pixel ratio again here unless it changes dynamically
}