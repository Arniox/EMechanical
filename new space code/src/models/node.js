import * as THREE from "three";
import Utilities from "../world/utilities.js";
import { FloatingPanel } from "../components/FloatingPanel.js";
import { FormulaRenderer } from "../components/FormulaRenderer.js";

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

        // UI Panel
        this.panel = null;

        // Labels for properties
        this.labels = {
            position: null,
            mass: null,
            force: null,
            acceleration: null,
            velocity: null
        };
    }

    /**
     * @param {THREE.Scene} scene 
     * @param {THREE.Camera} camera
     */
    add(scene, camera = null) {
        scene.add(this.mesh);

        // Create floating panel if camera is provided
        if (camera) {
            this.createPanel(scene, camera);
        }
    }

    /**
     * @param {THREE.Scene} scene 
     */
    delete(scene) {
        // Remove all arrows
        for (const key in this) {
            if (this[key] && this[key].arrow) {
                this[key].arrow.geometry.dispose();
                this[key].arrow.material.dispose();
                scene.remove(this[key].arrow);
                this[key].arrow = null;
            }
        }

        // Remove the node from the scene
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

        // Remove panel if exists
        if (this.panel) {
            this.panel.remove();
        }

        // Remove labels
        for (const key in this.labels) {
            if (this.labels[key]) {
                document.body.removeChild(this.labels[key]);
                this.labels[key] = null;
            }
        }

        this.geometry = null;
        this.material = null;
        this.mesh = null;
    }

    /**
     * Creates a floating panel for this node
     * @param {THREE.Scene} scene 
     * @param {THREE.Camera} camera 
     */
    createPanel(scene, camera) {
        // Define fields for the panel
        const fields = {
            position: {
                label: "Position (x, y, z)",
                value: `${this.position.x.toFixed(3)}, ${this.position.y.toFixed(3)}, ${this.position.z.toFixed(3)}`,
                type: "text",
                readOnly: true
            },
            mass: {
                label: "Mass (kg)",
                value: this.mass,
                type: "number",
                min: 0.1,
                step: 0.1
            },
            forceX: {
                label: "Force X (N)",
                value: this.force.vector.x,
                type: "number",
                step: 0.1
            },
            forceY: {
                label: "Force Y (N)",
                value: this.force.vector.y,
                type: "number",
                step: 0.1
            },
            forceZ: {
                label: "Force Z (N)",
                value: this.force.vector.z,
                type: "number",
                step: 0.1
            },
            fixed: {
                label: "Fixed Node",
                value: this.isFixed ? "Yes" : "No",
                type: "checkbox"
            }
        };

        // Create panel
        this.panel = new FloatingPanel({
            target: this.mesh,
            camera: camera,
            scene: scene,
            title: "Node Properties",
            fields: fields,
            panelId: `node-panel-${Math.random().toString(36).substr(2, 9)}`,
            offset: new THREE.Vector3(0, this.radius * 2, 0),
            onUpdate: (key, value, fields) => {
                // Handle updates to fields
                switch (key) {
                    case 'mass':
                        this.mass = parseFloat(value);
                        break;
                    case 'forceX':
                        this.force.vector.x = parseFloat(value);
                        this.updateForceFormula();
                        break;
                    case 'forceY':
                        this.force.vector.y = parseFloat(value);
                        this.updateForceFormula();
                        break;
                    case 'forceZ':
                        this.force.vector.z = parseFloat(value);
                        this.updateForceFormula();
                        break;
                    case 'fixed':
                        this.setFixed(value === "Yes");
                        break;
                }
            }
        });

        // Hide panel initially
        this.panel.hide();

        // Create labels for properties
        this.createLabels();
    }

    /**
     * Creates text labels for node properties
     */
    createLabels() {
        // Position label
        this.labels.position = document.createElement('div');
        this.labels.position.className = 'node-label position-label';
        document.body.appendChild(this.labels.position);

        // Mass label
        this.labels.mass = document.createElement('div');
        this.labels.mass.className = 'node-label mass-label';
        document.body.appendChild(this.labels.mass);

        // Force label
        this.labels.force = document.createElement('div');
        this.labels.force.className = 'node-label force-label';
        document.body.appendChild(this.labels.force);

        // Acceleration label
        this.labels.acceleration = document.createElement('div');
        this.labels.acceleration.className = 'node-label acceleration-label';
        document.body.appendChild(this.labels.acceleration);

        // Velocity label
        this.labels.velocity = document.createElement('div');
        this.labels.velocity.className = 'node-label velocity-label';
        document.body.appendChild(this.labels.velocity);

        // Hide labels initially
        this.hideLabels();
    }

    /**
     * Updates the force formula in the panel
     */
    updateForceFormula() {
        if (!this.panel) return;

        // Calculate acceleration from force
        const acceleration = this.force.vector.clone().divideScalar(this.mass);

        // Generate formula
        const formula = FormulaRenderer.renderPhysicsFormula('acceleration', {
            force: this.force.vector.length(),
            mass: this.mass
        });

        // Update panel with formula
        this.panel.updateField('forceX', this.force.vector.x, formula);
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

        // Update panel if it exists
        if (this.panel) {
            this.panel.updateField('forceX', this.force.vector.x);
            this.panel.updateField('forceY', this.force.vector.y);
            this.panel.updateField('forceZ', this.force.vector.z);
            this.updateForceFormula();
        }
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

        // Update panel if it exists
        if (this.panel) {
            this.panel.updateField('fixed', isFixed ? "Yes" : "No");
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

            // Show panel if it exists
            if (this.panel) {
                this.panel.show();
            }

            // Show labels
            this.showLabels();

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

        // Hide panel if it exists
        if (this.panel) {
            this.panel.hide();
        }

        // Hide labels
        this.hideLabels();
    }

    /**
     * Show property labels
     */
    showLabels() {
        for (const key in this.labels) {
            if (this.labels[key]) {
                this.labels[key].style.display = 'block';
            }
        }
    }

    /**
     * Hide property labels
     */
    hideLabels() {
        for (const key in this.labels) {
            if (this.labels[key]) {
                this.labels[key].style.display = 'none';
            }
        }
    }

    /**
     * Update label positions in screen space
     * @param {THREE.Camera} camera 
     */
    updateLabelPositions(camera) {
        if (!this.labels.position) return;

        // Get node position in world space
        const nodePos = new THREE.Vector3();
        this.mesh.getWorldPosition(nodePos);

        // Project to screen space
        const screenPos = nodePos.clone().project(camera);

        // Convert to CSS coordinates
        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

        // Position labels with offsets
        const offsets = {
            position: { x: 0, y: -40 },
            mass: { x: 0, y: -20 },
            force: { x: 60, y: 0 },
            acceleration: { x: 60, y: 20 },
            velocity: { x: 60, y: 40 }
        };

        // Update label content and position
        for (const key in this.labels) {
            if (this.labels[key]) {
                // Update content
                switch (key) {
                    case 'position':
                        this.labels[key].textContent = `Pos: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)})`;
                        break;
                    case 'mass':
                        this.labels[key].textContent = `Mass: ${this.mass.toFixed(1)} kg`;
                        break;
                    case 'force':
                        this.labels[key].textContent = `Force: ${this.force.vector.length().toFixed(2)} N`;
                        break;
                    case 'acceleration':
                        this.labels[key].textContent = `Accel: ${this.acceleration.vector.length().toFixed(2)} m/s²`;
                        break;
                    case 'velocity':
                        this.labels[key].textContent = `Vel: ${this.velocity.vector.length().toFixed(2)} m/s`;
                        break;
                }

                // Update position
                const offset = offsets[key];
                this.labels[key].style.left = `${x + offset.x}px`;
                this.labels[key].style.top = `${y + offset.y}px`;

                // Hide if behind camera
                if (screenPos.z > 1) {
                    this.labels[key].style.display = 'none';
                } else if (this.isSelected) {
                    this.labels[key].style.display = 'block';
                }
            }
        }
    }

    /**
     * Update the node's position, scale, and rotation based on its properties.
     * @param {number} deltaTime - The time since the last update (not used here, but can be useful for animations).
     * @param {THREE.Camera} camera - Camera for updating UI elements
     */
    update(deltaTime, camera = null) {
        // Update position
        this.position.copy(this.mesh.position);

        // Update motion
        this.dampenMotion(deltaTime);

        // Update Affects
        this.createArrow("force", 0xffa500, Utilities.worldSize);
        this.createArrow("acceleration", 0x90EE90, Utilities.worldSize);
        this.createArrow("velocity", 0x72bcd4, Utilities.worldSize);
        this.createOutline();

        // Update panel position if it exists
        if (this.panel && camera) {
            this.panel.updatePosition();

            // Update panel fields
            this.panel.updateField('position', `${this.position.x.toFixed(3)}, ${this.position.y.toFixed(3)}, ${this.position.z.toFixed(3)}`);
        }

        // Update label positions
        if (camera) {
            this.updateLabelPositions(camera);
        }
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

        // The portion of the arrow that extends beyond the node's radius:
        let visibleLength = arrowLength - this.radius;
        if (visibleLength < 0) {
            visibleLength = 0;
        }

        // Cap the arrow head size so it doesn't get huge if arrow is large, or exceed some fraction of the node's diameter. Can't exceed node radius
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
        // Add to the node's parent, if any.
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
