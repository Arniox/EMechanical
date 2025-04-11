// src/models/EngineeringManager.ts
import * as THREE from "three";
import { Node } from './Node';
import { Beam } from './Beam';

export class EngineeringManager {
    public nodes: Node[];
    public beams: Beam[];

    constructor() {
        this.nodes = [];
        this.beams = [];
    }

    get isOnly2NodesSelected(): boolean {
        return this.nodes.filter(x => x.isSelected).length === 2;
    }

    get isOnly1NodeSelected(): boolean {
        return this.nodes.filter(x => x.isSelected).length === 1;
    }

    get isAnySelected(): boolean {
        return this.nodes.some(node => node.isSelected);
    }

    get selectedNodes(): Node[] {
        return this.nodes.filter(node => node.isSelected);
    }

    get nodeMeshes(): THREE.Mesh[] {
        return this.nodes.map(node => node.mesh);
    }

    get beamMeshes(): THREE.Mesh[] {
        return this.beams.map(beam => beam.mesh);
    }

    selectedNode(index: number): Node | undefined {
        return this.nodes.find(node => node.isSelected && node.selectedIndex === index);
    }

    createNode(position: THREE.Vector3, scene: THREE.Scene): Node {
        const node = new Node(position);
        node.add(scene);
        this.nodes.push(node);
        return node;
    }

    deleteNode(node: Node, scene: THREE.Scene): void {
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

    createBeam(startNode: Node, endNode: Node, scene: THREE.Scene): Beam {
        const beam = new Beam(startNode, endNode);
        beam.add(scene);
        this.beams.push(beam);
        return beam;
    }

    deleteBeam(beam: Beam, scene: THREE.Scene): void {
        beam.delete(scene);
        const index = this.beams.indexOf(beam);
        if (index > -1) {
            this.beams.splice(index, 1);
        }
    }

    updateAllBeams(deltaTime: number): void {
        // Update all beams in the structure in async
        this.beams.map(beam => beam.update(deltaTime));
    }

    updateAllNodes(deltaTime: number): void {
        // Update all nodes in the structure in async
        this.nodes.map(node => node.update(deltaTime));
    }
}