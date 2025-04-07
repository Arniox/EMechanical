import * as THREE from "three";
import { Joiner } from "./node.js";
import { FloatingPanel } from "../components/FloatingPanel.js";
import { FormulaRenderer } from "../components/FormulaRenderer.js";

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
        this.material = {
            name: "Steel",
            density: 7850, // kg/m³
            youngsModulus: 200e9, // Pa
            tensileStrength: 400e6, // Pa
            compressiveStrength: 250e6, // Pa
            shearStrength: 150e6 // Pa
        };
        this.stress = 0; // Pa
        this.strain = 0; // Dimensionless
        this.forceType = "neutral"; // "tension", "compression", or "neutral"
        this.forceValue = 0; // N
        this.isSelected = false;
        this.selectedIndex = 0;

        // Setup Geometry and Material
        this.geometry = new THREE.CylinderGeometry(this.startRadius, this.endRadius, 1, 8);
        this.material3D = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.3
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material3D);
        this.mesh.castShadow = true;

        // UI Panel
        this.panel = null;

        // Labels for properties
        this.labels = {
            length: null,
            force: null,
            angles: null,
            material: null
        };
    }

    /**
     * @param {THREE.Scene} scene 
     * @param {THREE.Camera} camera
     */
    add(scene, camera = null) {
        scene.add(this.mesh);
        this.update();

        // Create floating panel if camera is provided
        if (camera) {
            this.createPanel(scene, camera);
        }
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
        this.material3D = null;
        this.mesh = null;

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
    }

    /**
     * Creates a floating panel for this beam
     * @param {THREE.Scene} scene 
     * @param {THREE.Camera} camera 
     */
    createPanel(scene, camera) {
        // Define fields for the panel
        const fields = {
            length: {
                label: "Length (m)",
                value: this.length.toFixed(3),
                type: "text",
                readOnly: true
            },
            material: {
                label: "Material",
                value: this.material.name,
                type: "select",
                options: ["Steel", "Aluminum", "Concrete", "Wood", "Titanium"]
            },
            forceType: {
                label: "Force Type",
                value: this.forceType,
                type: "text",
                readOnly: true
            },
            forceValue: {
                label: "Force (N)",
                value: this.forceValue.toFixed(2),
                type: "text",
                readOnly: true
            },
            stress: {
                label: "Stress (MPa)",
                value: (this.stress / 1e6).toFixed(2),
                type: "text",
                readOnly: true
            }
        };

        // Create panel
        this.panel = new FloatingPanel({
            target: this.mesh,
            camera: camera,
            scene: scene,
            title: "Beam Properties",
            fields: fields,
            panelId: `beam-panel-${Math.random().toString(36).substr(2, 9)}`,
            offset: new THREE.Vector3(0, 0, 0),
            onUpdate: (key, value, fields) => {
                // Handle updates to fields
                switch (key) {
                    case 'material':
                        this.setMaterial(value);
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
     * Creates text labels for beam properties
     */
    createLabels() {
        // Length label
        this.labels.length = document.createElement('div');
        this.labels.length.className = 'beam-label length-label';
        document.body.appendChild(this.labels.length);

        // Force label
        this.labels.force = document.createElement('div');
        this.labels.force.className = 'beam-label force-label';
        document.body.appendChild(this.labels.force);

        // Angles label
        this.labels.angles = document.createElement('div');
        this.labels.angles.className = 'beam-label angles-label';
        document.body.appendChild(this.labels.angles);

        // Material label
        this.labels.material = document.createElement('div');
        this.labels.material.className = 'beam-label material-label';
        document.body.appendChild(this.labels.material);

        // Hide labels initially
        this.hideLabels();
    }

    /**
     * Sets the beam material
     * @param {string} materialName 
     */
    setMaterial(materialName) {
        const materials = {
            "Steel": {
                name: "Steel",
                density: 7850,
                youngsModulus: 200e9,
                tensileStrength: 400e6,
                compressiveStrength: 250e6,
                shearStrength: 150e6,
                color: 0xaaaaaa
            },
            "Aluminum": {
                name: "Aluminum",
                density: 2700,
                youngsModulus: 69e9,
                tensileStrength: 310e6,
                compressiveStrength: 280e6,
                shearStrength: 207e6,
                color: 0xdddddd
            },
            "Concrete": {
                name: "Concrete",
                density: 2400,
                youngsModulus: 30e9,
                tensileStrength: 3e6,
                compressiveStrength: 30e6,
                shearStrength: 2e6,
                color: 0xcccccc
            },
            "Wood": {
                name: "Wood",
                density: 700,
                youngsModulus: 11e9,
                tensileStrength: 50e6,
                compressiveStrength: 30e6,
                shearStrength: 10e6,
                color: 0x8B4513
            },
            "Titanium": {
                name: "Titanium",
                density: 4500,
                youngsModulus: 110e9,
                tensileStrength: 1000e6,
                compressiveStrength: 970e6,
                shearStrength: 550e6,
                color: 0xb5b5b5
            }
        };

        if (materials[materialName]) {
            this.material = materials[materialName];
            this.material3D.color.setHex(this.material.color);

            // Update panel if it exists
            if (this.panel) {
                this.panel.updateField('material', materialName);

                // Generate material properties formula
                const formula = `
                    <div class="material-properties">
                        <div>Density: ${this.material.density} kg/m³</div>
                        <div>Young's Modulus: ${(this.material.youngsModulus / 1e9).toFixed(0)} GPa</div>
                        <div>Tensile Strength: ${(this.material.tensileStrength / 1e6).toFixed(0)} MPa</div>
                        <div>Compressive Strength: ${(this.material.compressiveStrength / 1e6).toFixed(0)} MPa</div>
                    </div>
                `;

                this.panel.updateField('material', materialName, formula);
            }
        }
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
        if (!this.labels.length) return;

        // Get beam midpoint in world space
        const midpoint = new THREE.Vector3();
        midpoint.addVectors(this.parents[0].position, this.parents[1].position).multiplyScalar(0.5);

        // Project to screen space
        const screenPos = midpoint.clone().project(camera);

        // Convert to CSS coordinates
        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

        // Position labels with offsets
        const offsets = {
            length: { x: 0, y: -30 },
            force: { x: 0, y: -10 },
            angles: { x: 0, y: 10 },
            material: { x: 0, y: 30 }
        };

        // Calculate beam direction and angles
        const direction = new THREE.Vector3().subVectors(
            this.parents[1].position,
            this.parents[0].position
        ).normalize();

        const xAxis = new THREE.Vector3(1, 0, 0);
        const yAxis = new THREE.Vector3(0, 1, 0);
        const zAxis = new THREE.Vector3(0, 0, 1);

        const angleX = Math.acos(Math.abs(direction.dot(xAxis))) * 180 / Math.PI;
        const angleY = Math.acos(Math.abs(direction.dot(yAxis))) * 180 / Math.PI;
        const angleZ = Math.acos(Math.abs(direction.dot(zAxis))) * 180 / Math.PI;

        // Update label content and position
        for (const key in this.labels) {
            if (this.labels[key]) {
                // Update content
                switch (key) {
                    case 'length':
                        this.labels[key].textContent = `Length: ${this.length.toFixed(2)} m`;
                        break;
                    case 'force':
                        this.labels[key].textContent = `Force: ${this.forceValue.toFixed(2)} N (${this.forceType})`;
                        // Set color based on force type
                        if (this.forceType === 'tension') {
                            this.labels[key].style.color = '#ff6666';
                        } else if (this.forceType === 'compression') {
                            this.labels[key].style.color = '#6666ff';
                        } else {
                            this.labels[key].style.color = '#ffffff';
                        }
                        break;
                    case 'angles':
                        this.labels[key].textContent = `Angles: X:${angleX.toFixed(1)}° Y:${angleY.toFixed(1)}° Z:${angleZ.toFixed(1)}°`;
                        break;
                    case 'material':
                        this.labels[key].textContent = `Material: ${this.material.name}`;
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
     * Select this beam
     */
    select() {
        this.isSelected = true;
        this.material3D.color.set(0xffff00); // Yellow for selected

        // Show panel if it exists
        if (this.panel) {
            this.panel.show();
        }

        // Show labels
        this.showLabels();
    }

    /**
     * Unselect this beam
     */
    unselect() {
        this.isSelected = false;
        this.material3D.color.setHex(this.material.color || 0xffffff); // Reset to material color

        // Hide panel if it exists
        if (this.panel) {
            this.panel.hide();
        }

        // Hide labels
        this.hideLabels();
    }

    /**
     * Calculate beam force (tension/compression)
     */
    calculateForce() {
        const startNode = this.parents[0];
        const endNode = this.parents[1];

        // Calculate beam direction vector
        const direction = new THREE.Vector3().subVectors(
            endNode.position,
            startNode.position
        ).normalize();

        // Calculate forces at each end
        const startForce = startNode.force.vector.clone();
        const endForce = endNode.force.vector.clone();

        // Project forces onto beam direction
        const startProjection = startForce.dot(direction);
        const endProjection = endForce.dot(direction);

        // Determine if beam is in tension or compression
        // If forces pull away from each other, it's tension
        // If forces push toward each other, it's compression
        this.forceType = 'neutral';
        this.forceValue = 0;

        if (startProjection > 0 && endProjection < 0) {
            this.forceType = 'tension';
            this.forceValue = (Math.abs(startProjection) + Math.abs(endProjection)) / 2;
        } else if (startProjection < 0 && endProjection > 0) {
            this.forceType = 'compression';
            this.forceValue = (Math.abs(startProjection) + Math.abs(endProjection)) / 2;
        }

        // Calculate stress (force / area)
        const area = Math.PI * Math.pow((this.startRadius + this.endRadius) / 2, 2);
        this.stress = this.forceValue / area;

        // Calculate strain (stress / Young's modulus)
        this.strain = this.stress / this.material.youngsModulus;

        // Generate formula explanation
        const formula = FormulaRenderer.renderPhysicsFormula(
            this.forceType === 'tension' ? 'beam_tension' : 'beam_compression',
            {
                force: this.forceValue,
                angle: 0 // Assuming force is along beam axis
            }
        );

        // Update panel if it exists
        if (this.panel) {
            this.panel.updateField('forceType', this.forceType);
            this.panel.updateField('forceValue', this.forceValue.toFixed(2), formula);
            this.panel.updateField('stress', (this.stress / 1e6).toFixed(2));
        }

        // Update beam color based on force type
        if (this.isSelected) {
            // Keep selection color
            this.material3D.color.set(0xffff00);
        } else {
            if (this.forceType === 'tension') {
                // Red for tension
                this.material3D.color.set(0xff6666);
            } else if (this.forceType === 'compression') {
                // Blue for compression
                this.material3D.color.set(0x6666ff);
            } else {
                // Default material color
                this.material3D.color.setHex(this.material.color || 0xffffff);
            }
        }
    }

    /**
     * Update the beam's position, scale, and rotation based on its nodes.
     * @param {number} deltaTime - The time since the last update (not used here, but can be useful for animations).
     * @param {THREE.Camera} camera - Camera for updating UI elements
     */
    update(deltaTime = 0, camera = null) {
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

        // Calculate forces
        this.calculateForce();

        // Update panel if it exists
        if (this.panel && camera) {
            this.panel.updatePosition();
            this.panel.updateField('length', this.length.toFixed(3));
        }

        // Update label positions
        if (camera) {
            this.updateLabelPositions(camera);
        }
    }
}
