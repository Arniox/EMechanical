ts
import * as THREE from 'three';
import { WorldElement } from './WorldElement';
import { Node } from './Node';
import Utilities from '../world/utilities';

export class Beam extends WorldElement {
    public startNode: Node;
    public endNode: Node;

    constructor(startNode: Node, endNode: Node) {
        super();
        this.startNode = startNode;
        this.endNode = endNode;
        this.position = new THREE.Vector3();
        this.force = new THREE.Vector3();

        const geometry = new THREE.BufferGeometry().setFromPoints([this.startNode.position, this.endNode.position]);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Line(geometry, material);
    }

    public override update(deltaTime: number): void {
        const positions = [this.startNode.position, this.endNode.position];
        const geometry = this.mesh.geometry as THREE.BufferGeometry;
        geometry.setFromPoints(positions);
        geometry.attributes.position.needsUpdate = true;
    }

    public override add(scene: THREE.Scene): void {
        scene.add(this.mesh);
    }

    public override delete(scene: THREE.Scene): void {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        if (Array.isArray(this.mesh.material)) {
            for (const material of this.mesh.material) {
                material.dispose();
            }
        } else {
            this.mesh.material.dispose();
        }
        this.mesh.removeFromParent();
    }
}