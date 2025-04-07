/**
 * SelectionManager.js
 * Manages advanced selection capabilities for the mechanical engineering calculator
 */
import * as THREE from "three";

export class SelectionManager {
    /**
     * Create a selection manager
     * @param {Object} options - Configuration options
     * @param {THREE.Scene} options.scene - The scene
     * @param {THREE.Camera} options.camera - The camera
     * @param {THREE.WebGLRenderer} options.renderer - The renderer
     * @param {Object} options.nodeManager - The node manager
     * @param {Object} options.transformControls - The transform controls
     */
    constructor(options) {
        this.scene = options.scene;
        this.camera = options.camera;
        this.renderer = options.renderer;
        this.nodeManager = options.nodeManager;
        this.transformControls = options.transformControls;

        // Selection state
        this.isMultiSelect = false;
        this.isDragSelecting = false;
        this.selectedObjects = [];

        // Drag selection box
        this.selectionBox = null;
        this.startPoint = new THREE.Vector2();
        this.endPoint = new THREE.Vector2();

        // Raycaster for selection
        this.raycaster = new THREE.Raycaster();

        // Alignment options panel
        this.alignmentPanel = null;

        // Initialize
        this.initialize();
    }

    /**
     * Initialize the selection manager
     */
    initialize() {
        // Create selection box
        this.createSelectionBox();

        // Add event listeners
        this.addEventListeners();
    }

    /**
     * Create the selection box element
     */
    createSelectionBox() {
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'selection-box';
        this.selectionBox.style.display = 'none';
        document.body.appendChild(this.selectionBox);
    }

    /**
     * Add event listeners for selection
     */
    addEventListeners() {
        // Mouse events for drag selection
        this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Keyboard events for multi-select and alignment
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    /**
     * Handle mouse down event
     * @param {MouseEvent} event - The mouse event
     */
    onMouseDown(event) {
        // Skip if right button or transform controls are active
        if (event.button !== 0 || this.transformControls.dragging) return;

        // Check if control key is pressed for multi-select
        if (!this.isMultiSelect) {
            // Start drag selection
            this.isDragSelecting = true;

            // Record start point
            this.startPoint.x = event.clientX;
            this.startPoint.y = event.clientY;
            this.endPoint.copy(this.startPoint);

            // Show selection box
            this.selectionBox.style.left = `${this.startPoint.x}px`;
            this.selectionBox.style.top = `${this.startPoint.y}px`;
            this.selectionBox.style.width = '0px';
            this.selectionBox.style.height = '0px';
            this.selectionBox.style.display = 'block';
        } else {
            // Single click selection in multi-select mode
            this.handleSingleClick(event);
        }
    }

    /**
     * Handle mouse move event
     * @param {MouseEvent} event - The mouse event
     */
    onMouseMove(event) {
        // Skip if not drag selecting
        if (!this.isDragSelecting) return;

        // Update end point
        this.endPoint.x = event.clientX;
        this.endPoint.y = event.clientY;

        // Update selection box
        const left = Math.min(this.startPoint.x, this.endPoint.x);
        const top = Math.min(this.startPoint.y, this.endPoint.y);
        const width = Math.abs(this.endPoint.x - this.startPoint.x);
        const height = Math.abs(this.endPoint.y - this.startPoint.y);

        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
    }

    /**
     * Handle mouse up event
     * @param {MouseEvent} event - The mouse event
     */
    onMouseUp(event) {
        // Skip if not drag selecting
        if (!this.isDragSelecting) return;

        // Hide selection box
        this.selectionBox.style.display = 'none';

        // Check if it was a click or drag
        const isClick = Math.abs(this.endPoint.x - this.startPoint.x) < 5 &&
            Math.abs(this.endPoint.y - this.startPoint.y) < 5;

        if (isClick) {
            // Handle as single click
            this.handleSingleClick(event);
        } else {
            // Handle as drag selection
            this.handleDragSelection();
        }

        // Reset drag selecting
        this.isDragSelecting = false;
    }

    /**
     * Handle key down event
     * @param {KeyboardEvent} event - The keyboard event
     */
    onKeyDown(event) {
        // Control key for multi-select
        if (event.key === 'Control') {
            this.isMultiSelect = true;
        }

        // Shift key for alignment options
        if (event.key === 'Shift' && this.selectedObjects.length > 1) {
            this.showAlignmentOptions();
        }

        // Delete key to delete selected objects
        if (event.key === 'Delete' && this.selectedObjects.length > 0) {
            this.deleteSelectedObjects();
        }
    }

    /**
     * Handle key up event
     * @param {KeyboardEvent} event - The keyboard event
     */
    onKeyUp(event) {
        // Control key for multi-select
        if (event.key === 'Control') {
            this.isMultiSelect = false;
        }

        // Shift key for alignment options
        if (event.key === 'Shift') {
            this.hideAlignmentOptions();
        }
    }

    /**
     * Handle single click selection
     * @param {MouseEvent} event - The mouse event
     */
    handleSingleClick(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Set up raycaster
        this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

        // Check for intersections with nodes
        const nodeIntersects = this.raycaster.intersectObjects(this.nodeManager.nodeMeshes);

        // Check for intersections with beams
        const beamIntersects = this.raycaster.intersectObjects(this.nodeManager.beamMeshes);

        // Handle node selection
        if (nodeIntersects.length > 0) {
            const nodeMesh = nodeIntersects[0].object;
            const nodeIndex = this.nodeManager.nodeMeshes.indexOf(nodeMesh);
            const node = this.nodeManager.nodes[nodeIndex];

            if (this.isMultiSelect) {
                // Toggle selection
                if (node.isSelected) {
                    this.deselectNode(node);
                } else {
                    this.selectNode(node);
                }
            } else {
                // Deselect all other nodes
                this.deselectAllNodes();
                this.deselectAllBeams();

                // Select this node
                this.selectNode(node);
            }
        }
        // Handle beam selection
        else if (beamIntersects.length > 0) {
            const beamMesh = beamIntersects[0].object;
            const beamIndex = this.nodeManager.beamMeshes.indexOf(beamMesh);
            const beam = this.nodeManager.beams[beamIndex];

            if (this.isMultiSelect) {
                // Toggle selection
                if (beam.isSelected) {
                    this.deselectBeam(beam);
                } else {
                    this.selectBeam(beam);
                }
            } else {
                // Deselect all other beams
                this.deselectAllNodes();
                this.deselectAllBeams();

                // Select this beam
                this.selectBeam(beam);
            }
        }
        // No intersections, deselect all if not in multi-select mode
        else if (!this.isMultiSelect) {
            this.deselectAllNodes();
            this.deselectAllBeams();
        }

        // Update node manager info panel
        this.nodeManager.updateInfoPanel();
    }

    /**
     * Handle drag selection
     */
    handleDragSelection() {
        // Convert selection box to normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        const boxLeft = Math.min(this.startPoint.x, this.endPoint.x);
        const boxRight = Math.max(this.startPoint.x, this.endPoint.x);
        const boxTop = Math.min(this.startPoint.y, this.endPoint.y);
        const boxBottom = Math.max(this.startPoint.y, this.endPoint.y);

        // If not in multi-select mode, deselect all first
        if (!this.isMultiSelect) {
            this.deselectAllNodes();
            this.deselectAllBeams();
        }

        // Check each node
        this.nodeManager.nodes.forEach(node => {
            // Project node position to screen space
            const nodePos = node.position.clone();
            const screenPos = nodePos.project(this.camera);

            // Convert to pixel coordinates
            const pixelX = ((screenPos.x + 1) / 2) * rect.width + rect.left;
            const pixelY = ((-screenPos.y + 1) / 2) * rect.height + rect.top;

            // Check if node is in selection box
            if (pixelX >= boxLeft && pixelX <= boxRight &&
                pixelY >= boxTop && pixelY <= boxBottom) {
                this.selectNode(node);
            }
        });

        // Check each beam (using midpoint)
        this.nodeManager.beams.forEach(beam => {
            // Calculate beam midpoint
            const midpoint = new THREE.Vector3().addVectors(
                beam.parents[0].position,
                beam.parents[1].position
            ).multiplyScalar(0.5);

            // Project midpoint to screen space
            const screenPos = midpoint.project(this.camera);

            // Convert to pixel coordinates
            const pixelX = ((screenPos.x + 1) / 2) * rect.width + rect.left;
            const pixelY = ((-screenPos.y + 1) / 2) * rect.height + rect.top;

            // Check if midpoint is in selection box
            if (pixelX >= boxLeft && pixelX <= boxRight &&
                pixelY >= boxTop && pixelY <= boxBottom) {
                this.selectBeam(beam);
            }
        });

        // Update node manager info panel
        this.nodeManager.updateInfoPanel();
    }

    /**
     * Select a node
     * @param {Object} node - The node to select
     */
    selectNode(node) {
        if (!node.isSelected) {
            node.select(this.transformControls, true);
            this.selectedObjects.push(node);
        }
    }

    /**
     * Deselect a node
     * @param {Object} node - The node to deselect
     */
    deselectNode(node) {
        if (node.isSelected) {
            node.unselect(this.transformControls);
            const index = this.selectedObjects.indexOf(node);
            if (index > -1) {
                this.selectedObjects.splice(index, 1);
            }
        }
    }

    /**
     * Select a beam
     * @param {Object} beam - The beam to select
     */
    selectBeam(beam) {
        if (!beam.isSelected) {
            beam.select();
            this.selectedObjects.push(beam);
        }
    }

    /**
     * Deselect a beam
     * @param {Object} beam - The beam to deselect
     */
    deselectBeam(beam) {
        if (beam.isSelected) {
            beam.unselect();
            const index = this.selectedObjects.indexOf(beam);
            if (index > -1) {
                this.selectedObjects.splice(index, 1);
            }
        }
    }

    /**
     * Deselect all nodes
     */
    deselectAllNodes() {
        this.nodeManager.nodes.forEach(node => {
            this.deselectNode(node);
        });
    }

    /**
     * Deselect all beams
     */
    deselectAllBeams() {
        this.nodeManager.beams.forEach(beam => {
            this.deselectBeam(beam);
        });
    }

    /**
     * Delete selected objects
     */
    deleteSelectedObjects() {
        // Create a copy of the selected objects array
        const objectsToDelete = [...this.selectedObjects];

        // Delete each object
        objectsToDelete.forEach(obj => {
            if (obj.constructor.name === 'Joiner') {
                this.nodeManager.deleteNode(obj);
            } else if (obj.constructor.name === 'Beam') {
                this.nodeManager.deleteBeam(obj);
            }
        });

        // Clear selected objects
        this.selectedObjects = [];

        // Update node manager info panel
        this.nodeManager.updateInfoPanel();
    }

    /**
     * Show alignment options panel
     */
    showAlignmentOptions() {
        // Skip if panel already exists
        if (this.alignmentPanel) return;

        // Create alignment panel
        this.alignmentPanel = document.createElement('div');
        this.alignmentPanel.className = 'alignment-options';
        this.alignmentPanel.innerHTML = `
            <div class="alignment-title">Alignment Options</div>
            <button id="align-x">Align X</button>
            <button id="align-y">Align Y</button>
            <button id="align-z">Align Z</button>
            <button id="distribute-x">Distribute X</button>
            <button id="distribute-y">Distribute Y</button>
            <button id="distribute-z">Distribute Z</button>
            <button id="cancel-align">Cancel</button>
        `;

        document.body.appendChild(this.alignmentPanel);

        // Add event listeners
        document.getElementById('align-x').addEventListener('click', () => this.alignSelectedNodes('x'));
        document.getElementById('align-y').addEventListener('click', () => this.alignSelectedNodes('y'));
        document.getElementById('align-z').addEventListener('click', () => this.alignSelectedNodes('z'));
        document.getElementById('distribute-x').addEventListener('click', () => this.distributeSelectedNodes('x'));
        document.getElementById('distribute-y').addEventListener('click', () => this.distributeSelectedNodes('y'));
        document.getElementById('distribute-z').addEventListener('click', () => this.distributeSelectedNodes('z'));
        document.getElementById('cancel-align').addEventListener('click', () => this.hideAlignmentOptions());
    }

    /**
     * Hide alignment options panel
     */
    hideAlignmentOptions() {
        if (this.alignmentPanel && this.alignmentPanel.parentNode) {
            this.alignmentPanel.parentNode.removeChild(this.alignmentPanel);
            this.alignmentPanel = null;
        }
    }

    /**
     * Align selected nodes along an axis
     * @param {string} axis - The axis to align along ('x', 'y', or 'z')
     */
    alignSelectedNodes(axis) {
        // Get selected nodes
        const selectedNodes = this.selectedObjects.filter(obj => obj.constructor.name === 'Joiner');

        // Skip if less than 2 nodes
        if (selectedNodes.length < 2) {
            this.hideAlignmentOptions();
            return;
        }

        // Calculate average position
        let sum = 0;
        selectedNodes.forEach(node => {
            sum += node.position[axis];
        });
        const average = sum / selectedNodes.length;

        // Align nodes
        selectedNodes.forEach(node => {
            const newPos = node.position.clone();
            newPos[axis] = average;
            node.mesh.position.copy(newPos);
            node.position.copy(newPos);
        });

        // Update beams
        this.nodeManager.updateAllBeams(0);

        // Update center of gravity
        this.nodeManager.updateCenterOfGravity();

        // Hide alignment options
        this.hideAlignmentOptions();
    }

    /**
     * Distribute selected nodes evenly along an axis
     * @param {string} axis - The axis to distribute along ('x', 'y', or 'z')
     */
    distributeSelectedNodes(axis) {
        // Get selected nodes
        const selectedNodes = this.selectedObjects.filter(obj => obj.constructor.name === 'Joiner');

        // Skip if less than 3 nodes
        if (selectedNodes.length < 3) {
            this.hideAlignmentOptions();
            return;
        }

        // Sort nodes by position on the specified axis
        selectedNodes.sort((a, b) => a.position[axis] - b.position[axis]);

        // Get min and max positions
        const minPos = selectedNodes[0].position[axis];
        const maxPos = selectedNodes[selectedNodes.length - 1].position[axis];
        const range = maxPos - minPos;

        // Distribute nodes
        for (let i = 1; i < selectedNodes.length - 1; i++) {
            const t = i / (selectedNodes.length - 1);
            const newPos = selectedNodes[i].position.clone();
            newPos[axis] = minPos + t * range;
            selectedNodes[i].mesh.position.copy(newPos);
            selectedNodes[i].position.copy(newPos);
        }

        // Update beams
        this.nodeManager.updateAllBeams(0);

        // Update center of gravity
        this.nodeManager.updateCenterOfGravity();

        // Hide alignment options
        this.hideAlignmentOptions();
    }
}
