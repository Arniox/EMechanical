import * as THREE from "three";
import { Joiner } from "./node.js";

export class Beam {
    /**
     * @param {Joiner} startNode 
     * @param {Joiner} endNode 
     */
    constructor(startNode, endNode) {
        this.parents = [startNode, endNode];
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
        scene.add(this.mesh);
        this.update();
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
     * @param {number} deltaTime - The time since the last update (not used here, but can be useful for animations).
     */
    update(deltaTime) {
        this.length = this.parents[0].position.distanceTo(this.parents[1].position);
        // Since the geometry is unit height, scale Y to match the distance.
        this.mesh.scale.set(1, this.length, 1);
        // Position the beam at the midpoint.
        const midpoint = new THREE.Vector3().addVectors(this.parents[0].position, this.parents[1].position).multiplyScalar(0.5);
        this.mesh.position.copy(midpoint);
        // Orient the beam: align the unit Y axis to the direction between nodes.
        const direction = new THREE.Vector3().subVectors(this.parents[1].position, this.parents[0].position).normalize();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        this.mesh.setRotationFromQuaternion(quaternion);
    }
}