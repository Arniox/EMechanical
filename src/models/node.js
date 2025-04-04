import * as THREE from "three";
import Utilities from "../world/utilities.js";
/** 
 * @import { TransformControls } from '/three/addons/controls/TransformControls.js'
 * @import { NodeManager } from './nodeManager.js'
 */

export class Joiner {
    /**
     * @param {THREE.Vector3} position
     */
    constructor(position) {
        this.position = position;
        this.arrowScaling = 0.1;
        this.isSelected = false;
        this.selectedIndex = 0;
        this.radius = 0.015; // Default radius for the node

        // Engineering properties
        this.mass = 100; // kg
        this.force = {
            vector: new THREE.Vector3(0, 0, 0),
            arrow: null,
        };
        this.acceleration = {
            vector: new THREE.Vector3(0, 0, 0),
            arrow: null,
        }
        this.velocity = {
            vector: new THREE.Vector3(0, 0, 0),
            arrow: null,
        }
        this.isFixed = false;

        // Setup Geometry and Material
        this.geometry = new THREE.SphereGeometry(this.radius, 16, 16);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xa0f0f0, // default blue
            roughness: 0.25,
            metalness: 0.5
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
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
        // Remove all arrows
        for (const key in this) {
            if (this[key].arrow) {
                this[key].arrow.geometry.dispose();
                this[key].arrow.material.dispose();
                this[key].arrow.dispose();
                this[key].arrow = null;
            }
        }

        // Remove the node from the scene
        scene.remove(node);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh.dispose();
        this.geometry = null;
        this.material = null;
        this.mesh = null;
    }

    /**
     * Sets the motion vector of the node of a specific type, and auto-updates the other motion vectors
     * using a smoothing factor to simulate inertia (momentum). This assumes that:
     *   - this.mass is the mass (default 1)
     *   - Utilities.simulationTime is the time step (default 1 second)
     *   - this.force.vector, this.acceleration.vector, and this.velocity.vector are THREE.Vector3
     * 
     * @param {string} type - "force", "acceleration", or "velocity"
     * @param {THREE.Vector3} motionVector 
     */
    setMotion(type, motionVector) {
        if (!this[type]) {
            console.warn(`Invalid motion type: ${type}`);
            return;
        }

        // Update the specified motion vector instantly
        this[type].vector.copy(motionVector);

        // Auto calculate the other motion vectors with application of Newton's laws
        if (type === "force") {
            // Auto compute acceleration and velocity from force: a = F / m, v = a * dt.
            this.acceleration.vector.add(this.force.vector.clone().divideScalar(this.mass));
            this.velocity.vector.add(this.acceleration.vector.clone().multiplyScalar(Utilities.simulationTime));
        }
        else if (type === "acceleration") {
            // Auto compute force and velocity from acceleration: F = m * a, v = a * dt.
            this.force.vector.add(this.acceleration.vector.clone().multiplyScalar(this.mass));
            this.velocity.vector.add(this.acceleration.vector.clone().multiplyScalar(Utilities.simulationTime));
        }
        else if (type === "velocity") {
            // Auto compute acceleration first then force from velocity: a = v / dt, F = m * a.
            this.acceleration.vector.add(this.velocity.vector.clone().divideScalar(Utilities.simulationTime));
            this.force.vector.add(this.acceleration.vector.clone().multiplyScalar(this.mass));
        }
    }

    /**
     * Sets the node's fixed state.
     * @param {boolean} isFixed 
     */
    setFixed(isFixed) {
        this.isFixed = isFixed;

        if (isFixed) {
            this.material.color.set(0x555555); // Dark Gray for fixed nodes
            this.mesh.scale.set(1.5, 1.5, 1.5);
        } else {
            this.material.color.set(0xa0f0f0); // Default color
            this.mesh.scale.set(1, 1, 1);
        }
    }

    /**
     * @param {TransformControls} transformControls 
     * @param {boolean} allowMultiple
     */
    select(transformControls, allowMultiple = false) {
        this.isSelected = true;
        this.selectedIndex += 1;

        // Unselect if more than 2 selections -> pop the last one
        // This is to prevent multiple selections beyond 2
        if (this.selectedIndex > 2) {
            this.unselect(transformControls);
            return;
        }

        // Unselect if selecting a new node
        // This is to prevent single selections beyond 1
        if (this.selectedIndex > 1 && !allowMultiple) {
            this.unselect(transformControls);
            return;
        }

        // Only detach controls if more than 1 node is selected
        // This is to allow multiple selections if allowMultiple is true
        if (this.selectedIndex > 1 || allowMultiple) {
            transformControls.detach();
            return;
        }

        // Attach the transform controls to the node
        if (this.selectedIndex === 1 && !allowMultiple) {
            transformControls.attach(this.mesh);
            return;
        }
    }

    /**
     * @param {TransformControls} transformControls 
     */
    unselect(transformControls) {
        this.isSelected = false;
        this.selectedIndex = 0;
        transformControls.detach();
    }

    /**
     * Update the node's position, scale, and rotation based on its properties.
     */
    update() {
        // Update position
        this.position.copy(this.mesh.position);

        // Update Affects
        this.createArrow("force", 0xffa500, Utilities.worldSize);
        this.createArrow("acceleration", 0x90EE90, Utilities.worldSize);
        this.createArrow("velocity", 0x72bcd4, Utilities.worldSize);
        this.createOutline();
    }

    /**
     * @param {string} type 
     * @param {THREE.ColorRepresentation} color 
     * @param {number} worldSize
     * @returns 
     */
    createArrow(type, color, worldSize) {
        // Remove existing arrow if the vector is zero
        if (this[type].vector.length() === 0 && this[type].arrow) {
            this[type].arrow.geometry.dispose();
            this[type].arrow.material.dispose();
            this[type].arrow.dispose();
            this[type].arrow = null;
            this.mesh.parent.remove(this[type].arrow);
        }

        // Skip if the vector is zero
        if (this[type].vector.length() === 0) {
            return;
        }

        // Scale the axis to the world size
        const ωx = (this[type].vector.x / worldSize) + 0.75;
        const ωy = (this[type].vector.y / worldSize) + 0.75;
        const ωz = (this[type].vector.z / worldSize) + 0.75;
        const arrowVector = new THREE.Vector3(ωx, ωy, ωz);

        // If the arrow exists and the vector is not zero, update its position
        if (this[type].arrow) {
            this[type].arrow.position.copy(this.position);
            this[type].arrow.setDirection(arrowVector.clone().normalize());
            return;
        }

        // Create the arrow helper
        const arrow = new THREE.ArrowHelper(
            arrowVector.clone().normalize(),
            this.position,
            arrowVector.length() * this.arrowScaling,
            color,
            0.025,
            0.01
        );
        this.mesh.parent.add(arrow);
        this[type].arrow = arrow;
    }

    /**
     * Creates an outline around the node for selection.
     * This is a wireframe mesh that is slightly larger than the original node.
     */
    createOutline() {
        // If not selected, and outline exists, remove it
        if (!this.isSelected && this.mesh.userData.selectionOutline) {
            this.mesh.remove(this.mesh.userData.selectionOutline);
            delete this.mesh.userData.selectionOutline;
        }

        // Skip if not selected
        if (!this.isSelected) {
            return;
        }

        // Skip if selected and outline exists
        if (this.mesh.userData.selectionOutline) {
            return;
        }

        // Create outline geometry and material
        const outlineGeom = this.geometry.clone();
        const outlineMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
        });
        const outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
        // Position relative to the node (so it moves with it)
        outlineMesh.position.set(0, 0, 0);
        outlineMesh.rotation.set(0, 0, 0);
        outlineMesh.scale.copy(this.mesh.scale).multiplyScalar(1.1);
        this.mesh.add(outlineMesh); // Attach as child
        this.mesh.userData.selectionOutline = outlineMesh;
    }
}