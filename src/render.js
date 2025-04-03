// src/render.js
import { world, container } from './main.js';

function animate() {
    requestAnimationFrame(animate); // Loop

    // Run Updates
    world.updateAll();

    // Render
    world.render();
}

export function startAnimationLoop() {
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