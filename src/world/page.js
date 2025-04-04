import * as THREE from "three";
import { handleResize } from '../render.js';
import Utilities from './utilities.js';
/** 
 * @import { World } from './world.js'
 * @import { Joiner } from '../models/node.js'
 */

export class Page {
    /**
     * @param {World} world 
     */
    constructor(world) {
        /** @type {World} */
        this.world = world;
        this.rayCaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Setup Initial HTML
        this.buildHtml();
        this.createEventListeners();
    }

    /**
     * Runs any setup code needed for the page.
     * This is called when the page is first loaded.
     */
    buildHtml() {
        // Force Input Setup
        Utilities.ui.forceXInput.setAttribute('max', Utilities.worldSize);
        Utilities.ui.forceYInput.setAttribute('max', Utilities.worldSize);
        Utilities.ui.forceZInput.setAttribute('max', Utilities.worldSize);
        Utilities.ui.forceXInput.setAttribute('min', -Utilities.worldSize);
        Utilities.ui.forceYInput.setAttribute('min', -Utilities.worldSize);
        Utilities.ui.forceZInput.setAttribute('min', -Utilities.worldSize);
    }

    /**
     * Sets up all page event listeners.
     * This is called when the page is first loaded.
     */
    createEventListeners() {
        // Window Event Listeners
        window.addEventListener('resize', handleResize);

        // Document Event Listeners
        document.addEventListener('keydown', this.documentKeyDownEventHandler.bind(this));
        document.addEventListener('keyup', this.documentKeyUpEventHandler.bind(this));

        // Canvas Event Listeners
        this.world.renderer.domElement.addEventListener("click", this.mouseClickEventHandler.bind(this));

        // Range Inputs
        Utilities.ui.worldSizeInput.addEventListener('input', this.worldSizeInputChangeEventHandler.bind(this));
        // Inputs
        Utilities.ui.unitSelect.addEventListener('change', this.unitSelectChangeEventHandler.bind(this));
        Utilities.ui.showGridCheckBox.addEventListener('change', this.showGridCheckboxChangeEventHandler.bind(this));
        Utilities.ui.forceXInput.addEventListener('input', this.forceInputEventHandler.bind(this));
        Utilities.ui.forceYInput.addEventListener('input', this.forceInputEventHandler.bind(this));
        Utilities.ui.forceZInput.addEventListener('input', this.forceInputEventHandler.bind(this));
        // Buttons
        Utilities.ui.addNodeButton.addEventListener('click', this.addNodeButtonClickEventHandler.bind(this));
        Utilities.ui.deleteButton.addEventListener('click', this.deleteSelectedButtonClickEventHandler.bind(this));
        Utilities.ui.linkButton.addEventListener('click', this.addBeamButtonClickEventHandler.bind(this));
        Utilities.ui.resetViewButton.addEventListener('click', this.resetCameraView.bind(this));
    }

    //#region Utility Functions
    /**
     * Updates the selected object information panel.
     * Only changes the text.
     * @param {string} text 
     */
    setSelectInfo(text) {
        Utilities.ui.infoPanel.textContent = text;
    }

    /**
     * Resets the camera view to the default position.
     * This is called when the reset view button is clicked.
     */
    resetCameraView() {
        this.world.camera.position.set(1.2, 1.2, 1.8);
        this.world.camera.lookAt(0, 0, 0);
        this.world.controls.target.set(0, 0, 0);
        this.world.controls.update();
    }

    /**
     * Checks if the toolbar is scrollable.
     * This is used to add or remove the scrollable class from the toolbar.
     */
    checkToolbarScroll() {
        if (Utilities.ui.toolbar.scrollHeight > Utilities.ui.toolbar.clientHeight) {
            Utilities.ui.toolbar.classList.add("scrollable");
        } else {
            Utilities.ui.toolbar.classList.remove("scrollable");
        }
    }
    //#endregion

    //#region Event Handlers
    /**
     * Handles a mouse click event on the canvas/renderer dom element.
     * This is used to select nodes and beams in the world.
     * It uses raycasting to determine which object was clicked.
     * It also updates the selected object information panel.
     * This is called when the canvas is clicked.
     * 
     * @param {Event} event 
     */
    mouseClickEventHandler(event) {
        const rendererBoundingRect = this.world.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rendererBoundingRect.left) / rendererBoundingRect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rendererBoundingRect.top) / rendererBoundingRect.height) * 2 + 1;
        this.rayCaster.setFromCamera(this.mouse, this.world.camera);

        // Get intersections
        const nodeIntersections = this.rayCaster.intersectObjects(this.world.nodeManager.nodeMeshes, true);
        const beamIntersections = this.rayCaster.intersectObjects(this.world.nodeManager.beamMeshes, true);

        // Handle node intersections
        if (nodeIntersections.length > 0 || this.world.isGizmoIntersecting) {
            // If currently clicking on the transform controls of a node, ignore the click event.
            if (this.world.isGizmoIntersecting) {
                this.world.isGizmoIntersecting = false;
                return;
            }

            // Get the top-level node (in case the intersection hits a child, like the outline)
            /** @type {Joiner|null} */
            let clickedNode = null;
            let clickedMesh = nodeIntersections[0].object;
            for (let n of this.world.nodeManager.nodes) {
                if (n.mesh === clickedMesh || (n.mesh.children && n.mesh.children.includes(clickedMesh))) {
                    clickedMesh = n.mesh;
                    clickedNode = n;
                    break;
                }
            }

            // Handle selecting multiple nodes
            if (Utilities.keyState.ControlLeft && clickedNode) {
                // Handle other selected nodes
                this.world.nodeManager.selectedNodes.forEach(node => node.select(this.world.transformControls.controls, true));
                // Select the new node
                clickedNode.select(this.world.transformControls.controls, true);

                // Set message
                if (this.world.nodeManager.isOnly1NodeSelected) {
                    this.setSelectInfo("Select an end node (Ctrl-click)");
                }
                else if (this.world.nodeManager.isOnly2NodesSelected) {
                    this.setSelectInfo("Connection established");
                }
                else {
                    this.setSelectInfo("Please Ctrl-click to select exactly 2 nodes to connect.");
                }
            }
            // Handle single node selection
            else {
                // Handle other selected nodes
                this.world.nodeManager.selectedNodes.forEach(node => node.select(this.world.transformControls.controls, false));

                // Select the new node - now that all others are unselected
                clickedNode.select(this.world.transformControls.controls, false);

                // Set message
                if (this.world.nodeManager.isOnly1NodeSelected) {
                    this.setSelectInfo("Selected node for movement");
                }
                else {
                    this.setSelectInfo("No object selected");
                }
            }
        }
        else {
            // Handle all selected nodes
            this.world.nodeManager.selectedNodes.forEach(node => node.select(this.world.transformControls.controls, false));

            // Set message
            this.setSelectInfo("No object selected");
        }

        // Handle Node Info Panel
        this.world.nodeManager.updateInfoPanel();
        this.checkToolbarScroll();
    }

    /**
     * Handles a keyboard KeyDown event.
     * @param {Event} event 
     */
    documentKeyDownEventHandler(event) {
        // Set KeyState to true
        Utilities.keyState[event.code] = true;

        // Handle ControlLeft Key
        if (Utilities.keyState.ControlLeft) {
            // Ctrl key pressed
            if (this.world.nodeManager.isOnly1NodeSelected) {
                this.setSelectInfo("Select an end node (Ctrl-click)");
            }
            else {
                // Ctrl key pressed without selecting a node
                this.setSelectInfo("Multiselect mode (Ctrl-click)");
            }
        }
    }

    /**
     * Handles a keyboard KeyUp event.
     * @param {Event} event 
     */
    documentKeyUpEventHandler(event) {
        // Handle ControlLeft key
        if (Utilities.keyState.ControlLeft) {
            if (this.world.nodeManager.isAnySelected) {
                // Ctrl key released
                this.setSelectInfo("Selected node for movement");
            }
            else {
                // Ctrl key released without selecting a node
                this.setSelectInfo("No object selected");
            }
        }

        // Set KeyState to false
        Utilities.keyState[event.code] = false;
    }

    /**
     * Handles the change event for the show grid checkbox.
     * This shows or hides the grid based on the checkbox state.
     * @param {Event} event 
     */
    showGridCheckboxChangeEventHandler(event) {
        this.world.gridHelper.visible = event.target.checked;
    }

    /**
     * Handles the change event for the unit select dropdown.
     * This updates the world size output based on the selected unit.
     */
    unitSelectChangeEventHandler() {
        const worldScaleString = Utilities.stringifiyUnit(Utilities.worldScale);
        const worldScaleOutput = Utilities.unit === "m"
            ? ""
            : ` - <span class="unitConversionResult">${worldScaleString} m</span>`;

        // Set
        Utilities.ui.worldSizeOutput.innerHTML = `${Utilities.worldSize} ${Utilities.unit}${worldScaleOutput}`;
        Utilities.ui.forceXInput.setAttribute('max', Utilities.worldSize);
        Utilities.ui.forceYInput.setAttribute('max', Utilities.worldSize);
        Utilities.ui.forceZInput.setAttribute('max', Utilities.worldSize);
        Utilities.ui.forceXInput.setAttribute('min', -Utilities.worldSize);
        Utilities.ui.forceYInput.setAttribute('min', -Utilities.worldSize);
        Utilities.ui.forceZInput.setAttribute('min', -Utilities.worldSize);
    }

    /**
     * Handles the input change event for the world size input field.
     * This updates the world size output based on the input value.
     */
    worldSizeInputChangeEventHandler() {
        const worldScaleString = Utilities.stringifiyUnit(Utilities.worldScale);
        const worldScaleOutput = Utilities.unit === "m"
            ? ""
            : ` - <span class="unitConversionResult">${worldScaleString} m</span>`;

        // Set
        Utilities.ui.worldSizeOutput.innerHTML = `${Utilities.worldSize} ${Utilities.unit}${worldScaleOutput}`;
        Utilities.ui.forceXInput.setAttribute('max', Utilities.worldSize);
        Utilities.ui.forceYInput.setAttribute('max', Utilities.worldSize);
        Utilities.ui.forceZInput.setAttribute('max', Utilities.worldSize);
        Utilities.ui.forceXInput.setAttribute('min', -Utilities.worldSize);
        Utilities.ui.forceYInput.setAttribute('min', -Utilities.worldSize);
        Utilities.ui.forceZInput.setAttribute('min', -Utilities.worldSize);
    }

    /**
     * Handles the click event for the add node button.
     * This creates a new node at a random position in the world.
     * The position is constrained to the world size.
     * The node is added to the scene.
     */
    addNodeButtonClickEventHandler() {
        const randomPosition = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8
        );
        this.world.nodeManager.createNode(randomPosition, this.world.scene);
    }

    /**
     * Handles the input event for all force inputs.
     * As the user types, it updates the force on the selected node.
     */
    forceInputEventHandler() {
        if (Utilities.ui.forceXInput.value === "" || Utilities.ui.forceYInput.value === "" || Utilities.ui.forceZInput.value === "") {
            return; // skip if any of the inputs are empty
        }

        let xValue = parseFloat(Utilities.ui.forceXInput.value) || 0;
        let yValue = parseFloat(Utilities.ui.forceYInput.value) || 0;
        let zValue = parseFloat(Utilities.ui.forceZInput.value) || 0;
        // Set force
        if (this.world.nodeManager.isOnly1NodeSelected) {
            this.world.nodeManager.selectedNode(1).setForce(new THREE.Vector3(xValue, yValue, zValue));
        }
    }

    /**
     * Handles the click event for the delete selected button.
     * This deletes the selected node or beam.
     * If a node is deleted, it auto deletes all beams connected to it.
     */
    deleteSelectedButtonClickEventHandler() {
        if (this.world.nodeManager.isAnySelected) {
            this.world.nodeManager.selectedNode(1).delete(this.world.scene);
            this.setSelectInfo("No object selected");
        }
    }

    /**
     * Handles the click event for the add beam button.
     * This creates a beam between the two selected nodes.
     * If there are not exactly two nodes selected, it does nothing.
     */
    addBeamButtonClickEventHandler() {
        if (this.world.nodeManager.isOnly2NodesSelected) {
            this.world.nodeManager.createBeam(
                this.world.nodeManager.selectedNode(1),
                this.world.nodeManager.selectedNode(2),
                this.world.scene
            );
            this.setSelectInfo("Connected nodes");
        }
        else {
            this.setSelectInfo("Please Ctrl-click to select exactly 2 nodes to connect.");
        }
    }
    //#endregion
}