// src/main.js
import { World } from "./world/world.js";
import { Page } from "./world/page.js";
import { startAnimationLoop } from "./render.js";
import Utilities from "./world/utilities.js";

// --- DOM Container ---
export const container = document.getElementById("canvasContainer");
if (!container) {
    throw new Error("Could not find canvas container element!");
}

// Initialize the UI elements
Utilities.ui;

// Create a new world instance
export const world = new World();
export const page = new Page(world);

startAnimationLoop();
console.log("Mechanical system modeling setup complete.");