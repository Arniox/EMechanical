// src/render.js
import { scene, camera, renderer, controls, container, transformControls } from './main.js';
import { runComputations } from './computation.js'; // Import computation function

// The core animation function
function animate() {
    requestAnimationFrame(animate); // Loop

    // Update controls (for damping)
    controls.update();

    // Run computation checks/updates (currently empty)
    transformControls.update(); // Ensure gizmo updates
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