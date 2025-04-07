import * as THREE from "three";
import { World } from "./world/world.js";
import Utilities from "./world/utilities.js";
import { EducationalDisplay } from "./components/EducationalDisplay.js";

// Global container for the canvas
export const container = document.getElementById("canvasContainer");

// Global world instance
/** @type {World|null} */
let world = null;

// Global educational display
/** @type {EducationalDisplay|null} */
let educationalDisplay = null;

// Initialize the application
function init() {
    // Create world
    world = new World();

    // Create educational display
    educationalDisplay = new EducationalDisplay({
        container: document.body,
        displayLevel: 'intermediate'
    });

    // Set up UI elements
    setupUI();

    // Start animation loop
    animate();
}

// Set up UI elements and event listeners
function setupUI() {
    // Add event listeners
    Utilities.ui.addNodeButton.addEventListener("click", addNode);
    Utilities.ui.linkNodesButton.addEventListener("click", linkNodes);
    Utilities.ui.deleteSelectedButton.addEventListener("click", deleteSelected);
    Utilities.ui.resetViewButton.addEventListener("click", resetView);
    Utilities.ui.runAnalysisButton.addEventListener("click", runAnalysis);
    Utilities.ui.showFormulasButton.addEventListener("click", showFormulas);

    // Force input event listeners
    Utilities.ui.forceXInput.addEventListener("change", updateForce);
    Utilities.ui.forceYInput.addEventListener("change", updateForce);
    Utilities.ui.forceZInput.addEventListener("change", updateForce);

    // World scale event listeners
    Utilities.ui.worldSizeInput.addEventListener("change", updateWorldScale);
    Utilities.ui.worldUnitSelect.addEventListener("change", updateWorldScale);

    // Initialize world scale
    updateWorldScale();

    // Disable buttons initially
    Utilities.ui.linkNodesButton.disabled = true;
    Utilities.ui.deleteSelectedButton.disabled = true;
    Utilities.ui.forcePanel.style.display = "none";

    // Add window resize event listener
    window.addEventListener("resize", onWindowResize);
}

// Add a new node at a random position
function addNode() {
    if (!world || !world.nodeManager) return;

    // Get world dimensions
    const dimensions = world.worldScaleManager.getWorldDimensions();
    const halfWidth = dimensions.width / 2;
    const halfHeight = dimensions.height / 2;
    const halfDepth = dimensions.depth / 2;

    // Create random position within world bounds
    const position = new THREE.Vector3(
        (Math.random() - 0.5) * halfWidth,
        (Math.random() - 0.5) * halfHeight,
        (Math.random() - 0.5) * halfDepth
    );

    // Create node
    world.nodeManager.createNode(position);
}

// Link selected nodes with a beam
function linkNodes() {
    if (!world || !world.nodeManager) return;

    // Check if exactly 2 nodes are selected
    if (world.nodeManager.isOnly2NodesSelected) {
        // Get selected nodes
        const node1 = world.nodeManager.selectedNode(1);
        const node2 = world.nodeManager.selectedNode(2);

        // Create beam between nodes
        world.nodeManager.createBeam(node1, node2);

        // Deselect nodes
        node1.unselect(world.transformControls.controls);
        node2.unselect(world.transformControls.controls);
    }
}

// Delete selected node
function deleteSelected() {
    if (!world || !world.nodeManager) return;

    // Check if a node is selected
    if (world.nodeManager.isOnly1NodeSelected) {
        // Get selected node
        const node = world.nodeManager.selectedNode(1);

        // Delete node
        world.nodeManager.deleteNode(node);
    }
    // Check if a beam is selected
    else if (world.nodeManager.selectedBeams.length === 1) {
        // Get selected beam
        const beam = world.nodeManager.selectedBeams[0];

        // Delete beam
        world.nodeManager.deleteBeam(beam);
    }
}

// Reset camera view
function resetView() {
    if (!world || !world.camera) return;

    // Reset camera position
    world.camera.position.set(1.2, 1.2, 1.8);
    world.camera.lookAt(0, 0, 0);

    // Reset controls target
    world.controls.target.set(0, 0, 0);
    world.controls.update();
}

// Run physics analysis
function runAnalysis() {
    if (!world) return;

    world.runAnalysis();
}

// Show formulas for selected object
function showFormulas() {
    if (!world || !world.nodeManager || !educationalDisplay) return;

    // Check if a node is selected
    if (world.nodeManager.isOnly1NodeSelected) {
        // Get selected node
        const node = world.nodeManager.selectedNode(1);

        // Show node motion formulas
        educationalDisplay.showFormulas('node_motion', {
            node: node,
            force: node.force.vector,
            mass: node.mass,
            acceleration: node.acceleration.vector,
            velocity: node.velocity.vector,
            timeStep: Utilities.simulationTime
        });
    }
    // Check if a beam is selected
    else if (world.nodeManager.selectedBeams.length === 1) {
        // Get selected beam
        const beam = world.nodeManager.selectedBeams[0];

        // Show beam stress formulas
        educationalDisplay.showFormulas('beam_stress', {
            beam: beam,
            forceValue: beam.forceValue,
            forceType: beam.forceType,
            stress: beam.stress,
            strain: beam.strain
        });
    }
    // Show equilibrium formulas if nothing is selected
    else {
        const equilibriumResult = world.nodeManager.checkEquilibrium();
        educationalDisplay.showFormulas('equilibrium', equilibriumResult);
    }
}

// Update force on selected node
function updateForce() {
    if (!world || !world.nodeManager) return;

    // Check if a node is selected
    if (world.nodeManager.isOnly1NodeSelected) {
        // Get selected node
        const node = world.nodeManager.selectedNode(1);

        // Get force values from inputs
        const forceX = parseFloat(Utilities.ui.forceXInput.value) || 0;
        const forceY = parseFloat(Utilities.ui.forceYInput.value) || 0;
        const forceZ = parseFloat(Utilities.ui.forceZInput.value) || 0;

        // Create force vector
        const force = new THREE.Vector3(forceX, forceY, forceZ);

        // Set force on node
        node.setForce(force);

        // Update beams
        world.nodeManager.updateAllBeams(0);
    }
}

// Update world scale
function updateWorldScale() {
    if (!world) return;

    // Update world scale
    world.updateWorldScale(Utilities.worldSize, Utilities.unit);
}

// Handle window resize
function onWindowResize() {
    if (!world || !world.camera || !world.renderer) return;

    // Update camera aspect ratio
    world.camera.aspect = container.clientWidth / container.clientHeight;
    world.camera.updateProjectionMatrix();

    // Update renderer size
    world.renderer.setSize(container.clientWidth, container.clientHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (world) {
        // Update world
        world.updateAll(0.016); // Assuming 60fps (1/60 ≈ 0.016)

        // Render
        world.render();
    }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
