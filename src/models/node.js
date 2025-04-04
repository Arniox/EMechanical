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
     * Sets the force vector of the node and auto-updates the other motion vectors
     *   - this.mass is the mass (default 1)
     *   - Utilities.simulationTime is the time step (default 1 second)
     *   - this.force.vector, this.acceleration.vector, and this.velocity.vector are THREE.Vector3
     * 
     * @param {THREE.Vector3} motionVector 
     */
    setForce(motionVector) {
        // Update the specified motion vector instantly
        this.force.vector.copy(motionVector);

        // Skip if the vector is zero
        if (this.force.vector.length() === 0) {
            return;
        }

        // Auto compute acceleration and velocity from force: a = F / m, v = a * dt.
        this.acceleration.vector.add(this.force.vector.clone().divideScalar(this.mass));
        this.velocity.vector.add(this.acceleration.vector.clone().multiplyScalar(Utilities.simulationTime));
    }

    /**
 * Dampens the motion of the node if there is no force applied.
 * Applies friction such that velocity decays and the acceleration arrow decays more slowly.
 * @param {number} deltaTime - The time since the last update.
 */
    dampenMotion(deltaTime) {
        // If there is no force, gradually damp acceleration and velocity.
        if (this.force.vector.length() === 0) {
            // k is a friction constant (per second) for the physics update.
            const k = 1;
            // Compute friction acceleration: opposite to the velocity.
            const frictionAcc = this.velocity.vector.clone().multiplyScalar(-k);

            // Update velocity: v_new = v_old + a_f * deltaTime.
            this.velocity.vector.add(frictionAcc.multiplyScalar(deltaTime));

            // Instead of instantly setting acceleration to frictionAcc,
            // lerp the displayed acceleration more slowly so the arrow fades out gradually.
            const arrowDampening = k / 2; // Adjust this value for slower decay of the arrow.
            this.acceleration.vector.lerp(frictionAcc, arrowDampening * deltaTime);

            // If the velocity is very small, clamp it to 0.
            if (this.velocity.vector.length() < 0.001) {
                this.velocity.vector.set(0, 0, 0);
                // Further slowly decay acceleration towards zero.
                this.acceleration.vector.lerp(new THREE.Vector3(0, 0, 0), deltaTime * 0.1);
            }
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
     * @param {number} deltaTime - The time since the last update (not used here, but can be useful for animations).
     */
    update(deltaTime) {
        // Update position
        this.position.copy(this.mesh.position);

        // Update motion
        this.dampenMotion(deltaTime);

        // Update Affects
        this.createArrow("force", 0xffa500, Utilities.worldSize);
        this.createArrow("acceleration", 0x90EE90, Utilities.worldSize);
        this.createArrow("velocity", 0x72bcd4, Utilities.worldSize);
        this.createOutline();
    }

    /**
     * Creates or updates an arrow helper for a given motion vector.
     * If the vector is too small, the arrow is either not rendered
     * or just barely pokes out of the node's surface.
     *
     * @param {string} type - The motion type (e.g., "force").
     * @param {THREE.ColorRepresentation} color - The arrow color.
     * @param {number} worldSize - Used for scaling the arrow length.
     */
    createArrow(type, color, worldSize) {
        // The raw vector length in "world" units (e.g., Newtons if force).
        const forceMag = this[type].vector.length();

        // Threshold which we won't bother drawing the arrow. If it's smaller than half the node radius, skip it.
        const minDrawThreshold = this.radius * 0.5;
        if (forceMag < minDrawThreshold) {
            // Clean up if an arrow currently exists
            if (this[type].arrow) {
                this.mesh.parent.remove(this[type].arrow);
                this[type].arrow.dispose();
                this[type].arrow = null;
            }
            return;
        }

        // Convert the vector to a scaled version by dividing by worldSize so that large or small forces remain visible in the scene.
        const arrowVector = this[type].vector.clone().divideScalar(worldSize);
        const arrowLength = arrowVector.length(); // Visual length of the arrow

        // We'll offset the arrow's origin so it starts at the node's surface.
        // 1) direction = arrowVector normalized
        // 2) offset = direction * radius
        const direction = arrowVector.clone().normalize();
        const offset = direction.clone().multiplyScalar(this.radius);
        const arrowStart = this.position.clone().add(offset);

        // The portion of the arrow that extends beyond the node’s radius:
        let visibleLength = arrowLength - this.radius;
        if (visibleLength < 0) {
            visibleLength = 0;
        }

        // Cap the arrow head size so it doesn’t get huge if arrow is large, or exceed some fraction of the node’s diameter. Can't exceed node radius
        const headLen = this.radius * 1.5;    // arrow head length
        const headWidth = 0.015;              // arrow head width

        // If the arrow already exists, just update it.
        if (this[type].arrow) {
            this[type].arrow.position.copy(arrowStart);
            this[type].arrow.setDirection(direction);
            this[type].arrow.setLength(visibleLength, headLen, headWidth);
            return;
        }

        // Otherwise, create a new ArrowHelper
        const arrow = new THREE.ArrowHelper(
            direction,         // direction
            arrowStart,        // origin
            visibleLength,     // length
            color,             // color
            headLen,           // head length
            headWidth          // head width
        );
        // Add to the node’s parent, if any.
        if (this.mesh.parent) {
            this.mesh.parent.add(arrow);
        }
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