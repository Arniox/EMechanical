import * as THREE from 'three';
import { WorldElement } from './WorldElement';
import { Node } from './Node';

export class Beam extends WorldElement {
    public startNode: Node;
    public endNode: Node;

    private restDistance: number;

    constructor(startNode: Node, endNode: Node) {
        super();
        this.startNode = startNode;
        this.endNode = endNode;
        this.position = new THREE.Vector3();
        this.force = new THREE.Vector3();

        const geometry = new THREE.BufferGeometry().setFromPoints([this.startNode.position, this.endNode.position]);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);

        this.restDistance = this.startNode.position.distanceTo(this.endNode.position);
    }

    public override update(deltaTime: number): void {
        const currentDistance = this.startNode.position.distanceTo(this.endNode.position);
        const distanceDifference = currentDistance - this.restDistance;
        const forceStrength = 100;
        const forceMagnitude = distanceDifference * forceStrength;

        // Calculate the direction vector from startNode to endNode
        const direction = new THREE.Vector3().subVectors(this.endNode.position, this.startNode.position).normalize();

        // Calculate the force vector
        const force = direction.clone().multiplyScalar(forceMagnitude);

        // Apply half of the force to each node
        const halfForce = force.clone().multiplyScalar(0.5);

        this.startNode.setForce(this.startNode.force.clone().sub(halfForce));
        this.endNode.setForce(this.endNode.force.clone().add(halfForce));

        // Update beam position
        const positions = [this.startNode.position.clone(), this.endNode.position.clone()];
        const geometry = this.mesh.geometry as THREE.BufferGeometry;
        geometry.setFromPoints(positions)
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