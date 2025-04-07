/**
 * WorldScaleManager.js
 * Manages the world scale and unit conversions for the mechanical engineering calculator
 */
import * as THREE from "three";

export class WorldScaleManager {
    /**
     * Create a world scale manager
     * @param {Object} options - Configuration options
     * @param {THREE.Scene} options.scene - The scene
     * @param {Object} options.world - The world object
     */
    constructor(options) {
        this.scene = options.scene;
        this.world = options.world;

        // Scale markers
        this.scaleMarkers = [];
        this.scaleLabels = [];

        // Unit conversion factors (to meters)
        this.unitConversions = {
            "pm": 1e-12,   // picometer
            "nm": 1e-9,    // nanometer
            "μm": 1e-6,    // micrometer
            "mm": 1e-3,    // millimeter
            "cm": 1e-2,    // centimeter
            "m": 1,        // meter (base unit)
            "km": 1e3,     // kilometer
            "au": 149597870700, // astronomical unit
            "ly": 9.4607e15,    // light year
            "pc": 3.08567758149137e16, // parsec
            "in": 0.0254,  // inch
            "ft": 0.3048,  // foot
            "yd": 0.9144,  // yard
            "mi": 1609.344, // mile
            "ftm": 1.8288,  // fathom
            "nmi": 1852,    // nautical mile
        };

        // Current unit and scale
        this.currentUnit = "m";
        this.worldSize = 1;
        this.worldScale = 1;

        // Playable volume dimensions
        this.volumeWidth = 1;
        this.volumeHeight = 1;
        this.volumeDepth = 1;
    }

    /**
     * Update the world scale based on unit and size
     * @param {number} size - The world size value
     * @param {string} unit - The unit of measurement
     */
    updateWorldScale(size, unit) {
        this.worldSize = size;
        this.currentUnit = unit;

        // Calculate scale in meters
        this.worldScale = this.convertToMeters(size, unit);

        // Update volume dimensions based on screen aspect ratio
        const container = document.getElementById("canvasContainer");
        if (container) {
            const aspect = container.clientWidth / container.clientHeight;
            console.log(container, container.clientWidth, container.clientHeight);

            console.log(aspect);

            this.volumeWidth = this.worldSize * Math.max(1, aspect);
            this.volumeHeight = this.worldSize;
            this.volumeDepth = this.worldSize * Math.max(1, aspect);
        } else {
            this.volumeWidth = this.worldSize;
            this.volumeHeight = this.worldSize;
            this.volumeDepth = this.worldSize;
        }

        // Update world cube and grid
        this.updateWorldCube();
        this.updateWorldGrid();
        this.updateScaleMarkers();
    }

    /**
     * Convert a value from the current unit to meters
     * @param {number} value - The value to convert
     * @param {string} unit - The unit to convert from
     * @returns {number} The value in meters
     */
    convertToMeters(value, unit) {
        if (unit in this.unitConversions) {
            return value * this.unitConversions[unit];
        } else {
            console.warn(`Unit "${unit}" not recognized. Using meters.`);
            return value;
        }
    }

    /**
     * Convert a value from meters to the current unit
     * @param {number} meters - The value in meters
     * @returns {number} The value in the current unit
     */
    convertFromMeters(meters) {
        if (this.currentUnit in this.unitConversions) {
            return meters / this.unitConversions[this.currentUnit];
        } else {
            console.warn(`Unit "${this.currentUnit}" not recognized. Using meters.`);
            return meters;
        }
    }

    /**
     * Format a value with appropriate unit for display
     * @param {number} value - The value to format
     * @param {string} unit - The unit to use
     * @returns {string} Formatted value with unit
     */
    formatValueWithUnit(value, unit) {
        // Handle very large or very small numbers with scientific notation
        if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
            return `${value.toExponential(3)} ${unit}`;
        } else {
            return `${value.toFixed(3)} ${unit}`;
        }
    }

    /**
     * Update the world cube to match the current volume dimensions
     */
    updateWorldCube() {
        // Remove existing world cube
        if (this.world.worldCubeGroup) {
            this.scene.remove(this.world.worldCubeGroup);
        }

        // Create new world cube
        const halfWidth = this.volumeWidth / 2;
        const halfHeight = this.volumeHeight / 2;
        const halfDepth = this.volumeDepth / 2;

        const vertices = [
            new THREE.Vector3(-halfWidth, -halfHeight, -halfDepth),
            new THREE.Vector3(halfWidth, -halfHeight, -halfDepth),
            new THREE.Vector3(halfWidth, halfHeight, -halfDepth),
            new THREE.Vector3(-halfWidth, halfHeight, -halfDepth),
            new THREE.Vector3(-halfWidth, -halfHeight, halfDepth),
            new THREE.Vector3(halfWidth, -halfHeight, halfDepth),
            new THREE.Vector3(halfWidth, halfHeight, halfDepth),
            new THREE.Vector3(-halfWidth, halfHeight, halfDepth)
        ];

        // Create materials for the cube edges
        const materialX = new THREE.LineBasicMaterial({ color: 0xff0000 }); // X-axis: red
        const materialY = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Y-axis: green
        const materialZ = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Z-axis: blue

        this.world.worldCubeGroup = new THREE.Group();

        // Create edges for the cube
        this.world.worldCubeGroup.add(this.createLine(vertices[0], vertices[1], materialX));
        this.world.worldCubeGroup.add(this.createLine(vertices[3], vertices[2], materialX));
        this.world.worldCubeGroup.add(this.createLine(vertices[4], vertices[5], materialX));
        this.world.worldCubeGroup.add(this.createLine(vertices[7], vertices[6], materialX));

        this.world.worldCubeGroup.add(this.createLine(vertices[0], vertices[3], materialY));
        this.world.worldCubeGroup.add(this.createLine(vertices[1], vertices[2], materialY));
        this.world.worldCubeGroup.add(this.createLine(vertices[4], vertices[7], materialY));
        this.world.worldCubeGroup.add(this.createLine(vertices[5], vertices[6], materialY));

        this.world.worldCubeGroup.add(this.createLine(vertices[0], vertices[4], materialZ));
        this.world.worldCubeGroup.add(this.createLine(vertices[1], vertices[5], materialZ));
        this.world.worldCubeGroup.add(this.createLine(vertices[2], vertices[6], materialZ));
        this.world.worldCubeGroup.add(this.createLine(vertices[3], vertices[7], materialZ));

        this.scene.add(this.world.worldCubeGroup);
    }

    /**
     * Update the world grid to match the current volume dimensions
     */
    updateWorldGrid() {
        // Remove existing grid
        if (this.world.gridHelper) {
            this.scene.remove(this.world.gridHelper);
        }

        // Create new grid
        const gridSize = Math.max(this.volumeWidth, this.volumeDepth);
        const divisions = 10;

        this.world.gridHelper = new THREE.GridHelper(gridSize, divisions, 0x888888, 0x444444);
        this.world.gridHelper.position.y = -this.volumeHeight / 2; // Position at bottom of volume

        this.scene.add(this.world.gridHelper);
    }

    /**
     * Create a line between two points
     * @param {THREE.Vector3} v1 - Start point
     * @param {THREE.Vector3} v2 - End point
     * @param {THREE.Material} material - Line material
     * @returns {THREE.Line} The created line
     */
    createLine(v1, v2, material) {
        const geometry = new THREE.BufferGeometry().setFromPoints([v1, v2]);
        return new THREE.Line(geometry, material);
    }

    /**
     * Update scale markers to show dimensions
     */
    updateScaleMarkers() {
        // Remove existing markers
        this.scaleMarkers.forEach(marker => {
            this.scene.remove(marker);
        });

        // Remove existing labels
        this.scaleLabels.forEach(label => {
            if (label.element && label.element.parentNode) {
                label.element.parentNode.removeChild(label.element);
            }
        });

        this.scaleMarkers = [];
        this.scaleLabels = [];

        // Create new markers
        this.addAxisMarker('x', this.volumeWidth, 0xff0000);
        this.addAxisMarker('y', this.volumeHeight, 0x00ff00);
        this.addAxisMarker('z', this.volumeDepth, 0x0000ff);
    }

    /**
     * Add a scale marker for an axis
     * @param {string} axis - The axis ('x', 'y', or 'z')
     * @param {number} length - The length of the axis
     * @param {number} color - The color of the marker
     */
    addAxisMarker(axis, length, color) {
        const halfWidth = this.volumeWidth / 2;
        const halfHeight = this.volumeHeight / 2;
        const halfDepth = this.volumeDepth / 2;

        let start, end;

        switch (axis) {
            case 'x':
                start = new THREE.Vector3(-halfWidth, -halfHeight, -halfDepth);
                end = new THREE.Vector3(halfWidth, -halfHeight, -halfDepth);
                break;
            case 'y':
                start = new THREE.Vector3(-halfWidth, -halfHeight, -halfDepth);
                end = new THREE.Vector3(-halfWidth, halfHeight, -halfDepth);
                break;
            case 'z':
                start = new THREE.Vector3(-halfWidth, -halfHeight, -halfDepth);
                end = new THREE.Vector3(-halfWidth, -halfHeight, halfDepth);
                break;
            default:
                return;
        }

        // Create marker line
        const material = new THREE.LineDashedMaterial({
            color: color,
            dashSize: 0.05,
            gapSize: 0.05,
        });

        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const line = new THREE.Line(geometry, material);
        line.computeLineDistances(); // Required for dashed lines

        this.scene.add(line);
        this.scaleMarkers.push(line);

        // Create label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'scale-label';
        labelDiv.style.color = `#${color.toString(16).padStart(6, '0')}`;
        labelDiv.textContent = this.formatValueWithUnit(length, this.currentUnit);

        document.body.appendChild(labelDiv);

        // Position label at midpoint of line
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        // Store label info for updating
        this.scaleLabels.push({
            element: labelDiv,
            position: midpoint,
            axis: axis
        });
    }

    /**
     * Update the position of scale labels in screen space
     * @param {THREE.Camera} camera - The camera
     */
    updateLabelPositions(camera) {
        this.scaleLabels.forEach(label => {
            // Project position to screen space
            const screenPosition = label.position.clone().project(camera);

            // Convert to CSS coordinates
            const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(screenPosition.y * 0.5) + 0.5) * window.innerHeight;

            // Add offset based on axis
            let offsetX = 0;
            let offsetY = 0;

            switch (label.axis) {
                case 'x':
                    offsetY = 20;
                    break;
                case 'y':
                    offsetX = -20;
                    break;
                case 'z':
                    offsetX = -20;
                    offsetY = 20;
                    break;
            }

            // Apply position to element
            label.element.style.transform = `translate(${x + offsetX}px, ${y + offsetY}px)`;

            // Hide if behind camera
            if (screenPosition.z > 1) {
                label.element.style.display = 'none';
            } else {
                label.element.style.display = 'block';
            }
        });
    }

    /**
     * Get the current world dimensions
     * @returns {Object} The world dimensions
     */
    getWorldDimensions() {
        return {
            width: this.volumeWidth,
            height: this.volumeHeight,
            depth: this.volumeDepth,
            unit: this.currentUnit,
            scale: this.worldScale
        };
    }
}
