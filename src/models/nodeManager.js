import * as THREE from "three";
import { Node } from './node.js';
import { Beam } from './beam.js';

export class NodeManager {
    constructor() {
        /**
         * @type {Node[]}
         */
        this.nodes = [];
        /**
         * @type {Beam[]}
         */
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
     * @param {number} index
     * @returns {Node}
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
        const node = new Node(position);
        node.add(scene);
        this.nodes.push(node);
        return node;
    }

    /**
     * @param {Node} node 
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
     * @param {Node} startNode 
     * @param {Node} endNode
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

    // -----
    /**
     * Updates the position, scale, and rotation of all beams in the structure.
     * This function is asynchronous to allow for parallel processing.
     */
    async updateAllBeams() {
        // Update all beams in the structure in async
        await Promise.all(this.beams.map(beam => beam.update()));
    }

    /**
     * Updates the position, scale, and rotation of all nodes in the structure.
     * This function is asynchronous to allow for parallel processing.
     * @param {number} worldSize 
     */
    async updateAllNodes(worldSize) {
        // Update all nodes in the structure in async
        await Promise.all(this.nodes.map(node => node.update(worldSize)));

        // Check all nodes
        if (this.nodes.length > 0 && this.nodes.filter(x => x.isSelected).length === 2) {
            document.getElementById('addMember').disabled = false;
        }
        else {
            document.getElementById('addMember').disabled = true;
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