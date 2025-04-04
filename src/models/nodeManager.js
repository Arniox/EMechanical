import * as THREE from "three";
import { Joiner } from './node.js';
import { Beam } from './beam.js';
import Utilities from "../world/utilities.js";

export class NodeManager {
    constructor() {
        /** @type {Joiner[]} */
        this.nodes = [];
        /** @type {Beam[]} */
        this.beams = [];
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
     * @param {THREE.Scene} scene
     * @returns 
     */
    createNode(position, scene) {
        const node = new Joiner(position);
        node.add(scene);
        this.nodes.push(node);
        return node;
    }

    /**
     * @param {Joiner} node 
     * @param {THREE.Scene} scene 
     */
    deleteNode(node, scene) {
        node.delete(scene);
        const index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }

        // Remove all beams attached to this node
        let beamsToRemove = this.beams.filter(beam => beam.startNode === node || beam.endNode === node);
        for (const beam of beamsToRemove) {
            this.deleteBeam(beam, scene);
        }
    }

    /**
     * @param {Joiner} startNode 
     * @param {Joiner} endNode
     * @param {THREE.Scene} scene
     * @returns 
     */
    createBeam(startNode, endNode, scene) {
        const beam = new Beam(startNode, endNode);
        beam.add(scene);
        this.beams.push(beam);
        return beam;
    }

    /**
     * @param {Beam} beam 
     * @param {THREE.Scene} scene 
     */
    deleteBeam(beam, scene) {
        beam.delete(scene);
        const index = this.beams.indexOf(beam);
        if (index > -1) {
            this.beams.splice(index, 1);
        }
    }

    /**
     * Updates the position, scale, and rotation of all beams in the structure.
     */
    updateAllBeams() {
        // Update all beams in the structure in async
        this.beams.map(beam => beam.update());
    }

    /**
     * Updates the position, scale, and rotation of all nodes in the structure.
     */
    updateAllNodes() {
        // Update all nodes in the structure in async
        this.nodes.map(node => node.update());
    }

    /**
     * Updates the info panel with the selected node's information.
     */
    updateInfoPanel() {
        // Buttons
        Utilities.ui.deleteButton.disabled = !this.isOnly1NodeSelected;
        Utilities.ui.linkButton.disabled = !this.isOnly2NodesSelected;

        // Info panel
        if (this.isOnly1NodeSelected) {
            Utilities.ui.forcePanel.style.display = "block";

            // Set force inputs to current values
            Utilities.ui.forceXInput.value = this.selectedNode(1).force.vector.x;
            Utilities.ui.forceYInput.value = this.selectedNode(1).force.vector.y;
            Utilities.ui.forceZInput.value = this.selectedNode(1).force.vector.z;
        }
        else {
            Utilities.ui.forcePanel.style.display = "none";
            // Reset force inputs to zero
            Utilities.ui.forceXInput.value = 0;
            Utilities.ui.forceYInput.value = 0;
            Utilities.ui.forceZInput.value = 0;
        }
    }

    /**
     * @param {THREE.Scene} scene 
     */
    delete(scene) {
        for (const node of this.nodes) {
            node.delete(scene);
        }
        for (const member of this.beams) {
            member.delete(scene);
        }
        this.nodes = [];
        this.beams = [];
    }
}