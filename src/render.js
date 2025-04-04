// src/render.js
import { world, container } from './main.js';

/**
 * @type {number|null}
 */
let previousTime = null;
function animate() {
    requestAnimationFrame(animate); // Loop

    // Calculate deltaTime in seconds
    const currentTime = performance.now();
    const deltaTime = (currentTime - previousTime) / 1000;
    previousTime = currentTime;

    // Run Updates
    world.updateAll(deltaTime);

    // Render
    world.render();
}

export function startAnimationLoop() {
    previousTime = performance.now();
    animate();
}

export function handleResize() {
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    world.camera.aspect = width / height;
    world.camera.updateProjectionMatrix();
    world.renderer.setSize(width, height);
}