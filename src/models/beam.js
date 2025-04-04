import * as THREE from "three";
import { Joiner } from "./node.js";

export class Beam {
    /**
     * @param {Joiner} startNode 
     * @param {Joiner} endNode 
     */
    constructor(startNode, endNode) {
        this.startNode = startNode;
        this.endNode = endNode;
        this.length = 0;
        this.defaultRadius = 0.0025; // Default radius for the beam
        this.startRadius = startNode.radius > 0 ? startNode.radius / 3 : this.defaultRadius;
        this.endRadius = endNode.radius > 0 ? endNode.radius / 3 : this.defaultRadius;

        // Engineering properties
        this.tensileStrength = 0;
        this.compressiveStrength = 0;
        this.shearStrength = 0;
        this.material = 0;
        this.stress = 0;
        this.strain = 0;
        this.isSelected = false;
        this.selectedIndex = 0;

        // Setup Geometry and Material
        this.geometry = new THREE.CylinderGeometry(this.startRadius, this.endRadius, 1, 8);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.3
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
    }

    /**
     * @param {THREE.Scene} scene 
     */
    add(scene) {
        this.update();
        scene.add(this.mesh);
    }

    /**
     * @param {THREE.Scene} scene 
     */
    delete(scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh.dispose();
        this.geometry = null;
        this.material = null;
        this.mesh = null;
    }

    /**
     * Update the beam's position, scale, and rotation based on its nodes.
     */
    update() {
        this.length = this.startNode.position.distanceTo(this.endNode.position);
        // Since the geometry is unit height, scale Y to match the distance.
        this.mesh.scale.set(1, this.length, 1);
        // Position the beam at the midpoint.
        const midpoint = new THREE.Vector3().addVectors(this.startNode.position, this.endNode.position).multiplyScalar(0.5);
        this.mesh.position.copy(midpoint);
        // Orient the beam: align the unit Y axis to the direction between nodes.
        const direction = new THREE.Vector3().subVectors(this.endNode.position, this.startNode.position).normalize();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        this.mesh.setRotationFromQuaternion(quaternion);
    }
}