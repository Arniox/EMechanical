import * as THREE from "three";
import { Joiner } from "./node.js";
import { Beam } from "./beam.js";
import Utilities from "../world/utilities.js";
import { SelectionManager } from "../components/SelectionManager.js";
import { PhysicsEngine } from "../components/PhysicsEngine.js";

export class NodeManager {
    constructor(scene, camera) {
        /** @type {Joiner[]} */
        this.nodes = [];
        /** @type {Beam[]} */
        this.beams = [];

        this.scene = scene;
        this.camera = camera;

        // Initialize selection manager
        this.selectionManager = null;

        // Initialize physics engine
        this.physicsEngine = new PhysicsEngine({
            nodeManager: this
        });

        // Center of gravity marker
        this.cogMarker = null;
    }

    /**
     * Initialize the selection manager
     * @param {Object} options - Options for the selection manager
     */
    initSelectionManager(options) {
        this.selectionManager = new SelectionManager({
            scene: this.scene,
            camera: this.camera,
            renderer: options.renderer,
            nodeManager: this,
            transformControls: options.transformControls
        });
    }

    /**
     * @returns {boolean}
     */
    get isOnly2NodesSelected() {
        return this.nodes.filter(x => x.isSelected).length === 2;
    }

    /**
     * @returns {boolean}
     */
    get isOnly1NodeSelected() {
        return this.nodes.filter(x => x.isSelected).length === 1;
    }

    /**
     * @returns {boolean}
     */
    get isAnySelected() {
        return this.nodes.some(node => node.isSelected);
    }

    /**
     * @returns {Joiner[]}
     */
    get selectedNodes() {
        return this.nodes.filter(node => node.isSelected);
    }

    /**
     * @returns {Beam[]}
     */
    get selectedBeams() {
        return this.beams.filter(beam => beam.isSelected);
    }

    /**
     * @returns {THREE.Mesh[]}
     */
    get nodeMeshes() {
        return this.nodes.map(node => node.mesh);
    }

    /**
     * @returns {THREE.Mesh[]}
     */
    get beamMeshes() {
        return this.beams.map(beam => beam.mesh);
    }

    /**
     * @param {number} index
     * @returns {Joiner}
     */
    selectedNode(index) {
        return this.nodes.find(node => node.isSelected && node.selectedIndex === index);
    }

    /**
     * @param {THREE.Vector3} position 
     * @returns {Joiner}
     */
    createNode(position) {
        const node = new Joiner(position);
        node.add(this.scene, this.camera);
        this.nodes.push(node);
        return node;
    }

    /**
     * @param {Joiner} node 
     */
    deleteNode(node) {
        node.delete(this.scene);
        const index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }

        // Remove all beams attached to this node
        const beamsToRemove = this.beams.filter(beam =>
            beam.parents[0] === node || beam.parents[1] === node
        );

        for (const beam of beamsToRemove) {
            this.deleteBeam(beam);
        }

        // Update center of gravity
        this.updateCenterOfGravity();
    }

    /**
     * @param {Joiner} startNode 
     * @param {Joiner} endNode
     * @returns {Beam}
     */
    createBeam(startNode, endNode) {
        const beam = new Beam(startNode, endNode);
        beam.add(this.scene, this.camera);
        this.beams.push(beam);

        // Update center of gravity
        this.updateCenterOfGravity();

        return beam;
    }

    /**
     * @param {Beam} beam 
     */
    deleteBeam(beam) {
        beam.delete(this.scene);
        const index = this.beams.indexOf(beam);
        if (index > -1) {
            this.beams.splice(index, 1);
        }
    }

    /**
     * Updates the position, scale, and rotation of all beams in the structure.
     * @param {number} deltaTime - The time elapsed since the last update.
     */
    updateAllBeams(deltaTime) {
        // Update all beams in the structure
        this.beams.forEach(beam => beam.update(deltaTime, this.camera));
    }

    /**
     * Updates the position, scale, and rotation of all nodes in the structure.
     * @param {number} deltaTime - The time elapsed since the last update.
     */
    updateAllNodes(deltaTime) {
        // Update all nodes in the structure
        this.nodes.forEach(node => node.update(deltaTime, this.camera));
    }

    /**
     * Updates the info panel with the selected node's information.
     */
    updateInfoPanel() {
        // Buttons
        Utilities.ui.deleteSelectedButton.disabled = !this.isOnly1NodeSelected;
        Utilities.ui.linkNodesButton.disabled = !this.isOnly2NodesSelected;

        // Info panel
        if (this.isOnly1NodeSelected) {
            Utilities.ui.forcePanel.style.display = "block";

            // Set force inputs to current values
            const selectedNode = this.selectedNode(1);
            Utilities.ui.forceXInput.value = selectedNode.force.vector.x;
            Utilities.ui.forceYInput.value = selectedNode.force.vector.y;
            Utilities.ui.forceZInput.value = selectedNode.force.vector.z;

            // Update selected object info
            Utilities.ui.infoPanel.innerHTML = `
                <strong>Selected Node</strong><br>
                Position: (${selectedNode.position.x.toFixed(2)}, ${selectedNode.position.y.toFixed(2)}, ${selectedNode.position.z.toFixed(2)})<br>
                Mass: ${selectedNode.mass} kg<br>
                Force: ${selectedNode.force.vector.length().toFixed(2)} N<br>
                Acceleration: ${selectedNode.acceleration.vector.length().toFixed(2)} m/s²<br>
                Velocity: ${selectedNode.velocity.vector.length().toFixed(2)} m/s
            `;
        }
        else if (this.selectedBeams.length === 1) {
            Utilities.ui.forcePanel.style.display = "none";

            // Update selected object info for beam
            const selectedBeam = this.selectedBeams[0];
            Utilities.ui.infoPanel.innerHTML = `
                <strong>Selected Beam</strong><br>
                Length: ${selectedBeam.length.toFixed(2)} m<br>
                Material: ${selectedBeam.material.name}<br>
                Force: ${selectedBeam.forceValue.toFixed(2)} N (${selectedBeam.forceType})<br>
                Stress: ${(selectedBeam.stress / 1e6).toFixed(2)} MPa
            `;
        }
        else {
            Utilities.ui.forcePanel.style.display = "none";
            // Reset force inputs to zero
            Utilities.ui.forceXInput.value = 0;
            Utilities.ui.forceYInput.value = 0;
            Utilities.ui.forceZInput.value = 0;

            // Update selected object info
            Utilities.ui.infoPanel.textContent = "No object selected";
        }
    }

    /**
     * Update the center of gravity marker
     */
    updateCenterOfGravity() {
        // Calculate center of gravity
        const cogResult = this.physicsEngine.calculateCenterOfGravity();

        // Remove existing marker
        if (this.cogMarker) {
            this.scene.remove(this.cogMarker);
            if (this.cogMarker.geometry) this.cogMarker.geometry.dispose();
            if (this.cogMarker.material) this.cogMarker.material.dispose();
            this.cogMarker = null;
        }

        // Skip if no nodes or zero total mass
        if (this.nodes.length === 0 || cogResult.totalMass === 0) return;

        // Create new marker
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.7
        });

        this.cogMarker = new THREE.Mesh(geometry, material);
        this.cogMarker.position.copy(cogResult.position);
        this.scene.add(this.cogMarker);

        // Create label for CoG
        if (!this.cogLabel) {
            this.cogLabel = document.createElement('div');
            this.cogLabel.className = 'cog-label';
            document.body.appendChild(this.cogLabel);
        }

        // Update label content
        this.cogLabel.innerHTML = `
            Center of Gravity<br>
            (${cogResult.position.x.toFixed(2)}, ${cogResult.position.y.toFixed(2)}, ${cogResult.position.z.toFixed(2)})<br>
            Total Mass: ${cogResult.totalMass.toFixed(1)} kg
        `;

        // Position label
        if (this.camera) {
            const screenPos = cogResult.position.clone().project(this.camera);
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

            this.cogLabel.style.left = `${x}px`;
            this.cogLabel.style.top = `${y - 60}px`;

            // Hide if behind camera
            if (screenPos.z > 1) {
                this.cogLabel.style.display = 'none';
            } else {
                this.cogLabel.style.display = 'block';
            }
        }
    }

    /**
     * Check if the system is in equilibrium and display results
     */
    checkEquilibrium() {
        const result = this.physicsEngine.checkEquilibrium();

        // Create or update equilibrium display
        if (!this.equilibriumDisplay) {
            this.equilibriumDisplay = document.createElement('div');
            this.equilibriumDisplay.className = 'equilibrium-display';
            document.body.appendChild(this.equilibriumDisplay);
        }

        // Update display content
        this.equilibriumDisplay.innerHTML = `
            <div class="equilibrium-title">
                System ${result.isEquilibrium ? 'IS' : 'IS NOT'} in Equilibrium
            </div>
            <div class="equilibrium-details">
                Net Force: (${result.netForce.x.toFixed(2)}, ${result.netForce.y.toFixed(2)}, ${result.netForce.z.toFixed(2)}) N<br>
                Net Moment: (${result.netMoment.x.toFixed(2)}, ${result.netMoment.y.toFixed(2)}, ${result.netMoment.z.toFixed(2)}) N·m
            </div>
        `;

        // Style based on equilibrium status
        if (result.isEquilibrium) {
            this.equilibriumDisplay.classList.add('in-equilibrium');
            this.equilibriumDisplay.classList.remove('not-in-equilibrium');
        } else {
            this.equilibriumDisplay.classList.add('not-in-equilibrium');
            this.equilibriumDisplay.classList.remove('in-equilibrium');
        }

        return result;
    }

    /**
     * Calculate missing forces to achieve equilibrium
     */
    calculateMissingForces() {
        const result = this.physicsEngine.calculateMissingForces();

        if (result.success) {
            // Apply calculated reaction forces to fixed nodes
            result.fixedNodes.forEach(node => {
                node.setForce(result.reactionPerNode.clone());
            });

            // Update all nodes and beams
            this.updateAllNodes(0);
            this.updateAllBeams(0);

            // Check equilibrium again
            this.checkEquilibrium();
        }

        return result;
    }

    /**
     * Delete all nodes and beams
     */
    delete() {
        for (const node of this.nodes) {
            node.delete(this.scene);
        }
        for (const beam of this.beams) {
            beam.delete(this.scene);
        }

        // Remove CoG marker
        if (this.cogMarker) {
            this.scene.remove(this.cogMarker);
            if (this.cogMarker.geometry) this.cogMarker.geometry.dispose();
            if (this.cogMarker.material) this.cogMarker.material.dispose();
            this.cogMarker = null;
        }

        // Remove CoG label
        if (this.cogLabel && this.cogLabel.parentNode) {
            this.cogLabel.parentNode.removeChild(this.cogLabel);
            this.cogLabel = null;
        }

        // Remove equilibrium display
        if (this.equilibriumDisplay && this.equilibriumDisplay.parentNode) {
            this.equilibriumDisplay.parentNode.removeChild(this.equilibriumDisplay);
            this.equilibriumDisplay = null;
        }

        this.nodes = [];
        this.beams = [];
    }
}
