import * as THREE from "three";
import { OrbitControls } from "/three/addons/controls/OrbitControls.js";
import { TransformControls } from "/three/addons/controls/TransformControls.js";
import { NodeManager } from "../models/nodeManager.js";
import { container } from "../main.js";
import Utilities from "./utilities.js";
import { WorldScaleManager } from "../components/WorldScaleManager.js";

export class World {
    constructor() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); // Dark Gray

        // Controls
        this.controls = null;
        this.transformControls = {
            controls: null,
            isIntersecting: false,
        };

        // Camera
        this.camera = null;

        // Renderer
        this.renderer = null;

        // World Scale Manager
        this.worldScaleManager = null;

        // Node Manager
        this.nodeManager = null;

        // Lighting
        this.addAmbientLight();
        this.addDirectionalLight();
        this.addFillLight();

        // Rendering and Camera
        this.addCamera();
        this.addRenderer();

        // Controls
        this.addControls();
        this.addTransformControls();

        // World Objects
        this.initWorldScaleManager();

        // Node Manager
        this.initNodeManager();

        // Analysis results panel
        this.analysisPanel = null;
    }

    /**
     * @returns {boolean}
     */
    get isGizmoIntersecting() {
        return this.transformControls.isIntersecting;
    }
    /**
     * @param {boolean} value
     */
    set isGizmoIntersecting(value) {
        this.transformControls.isIntersecting = value;
    }

    /**
     * @returns {number}
     */
    get worldSize() {
        return this.worldScaleManager ?
            this.worldScaleManager.worldSize :
            Utilities.worldSize;
    }

    //#region Initialization
    addAmbientLight() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
    }

    addDirectionalLight() {
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(5, 10, 7.5);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.camera.near = 0.1;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -10;
        this.directionalLight.shadow.camera.right = 10;
        this.directionalLight.shadow.camera.top = 10;
        this.directionalLight.shadow.camera.bottom = -10;
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(this.directionalLight);
    }

    addFillLight() {
        this.fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        this.fillLight.position.set(-5, 2, -7.5);
        this.scene.add(this.fillLight);
    }

    initWorldScaleManager() {
        this.worldScaleManager = new WorldScaleManager({
            scene: this.scene,
            world: this
        });

        // Initialize with default values
        this.worldScaleManager.updateWorldScale(1, "m");
    }

    initNodeManager() {
        this.nodeManager = new NodeManager(this.scene, this.camera);

        // Initialize selection manager after renderer is created
        if (this.renderer) {
            this.nodeManager.initSelectionManager({
                renderer: this.renderer,
                transformControls: this.transformControls.controls
            });
        }
    }

    addCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(1.2, 1.2, 1.8); // Closer view
        this.camera.lookAt(0, 0, 0); // Ensure it looks at the center
    }

    addRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
    }

    addControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0); // Explicitly set target to origin
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 0.5;
        this.controls.maxDistance = 10;
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
        };
    }

    addTransformControls() {
        this.transformControls.controls = new TransformControls(this.camera, this.renderer.domElement);
        this.scene.add(this.transformControls.controls.getHelper());
        this.transformControls.controls.setMode("translate");
        this.transformControls.controls.setSize(0.5); // Increase gizmo size so it's more visible

        // Add event listeners for transform controls
        this.transformControls.controls.addEventListener("mouseDown", () => {
            this.controls.enabled = false;
            this.transformControls.isIntersecting = true;
        });
        this.transformControls.controls.addEventListener("mouseUp", () => {
            this.controls.enabled = true;
        });

        // Add event listener for transform changes
        this.transformControls.controls.addEventListener("objectChange", () => {
            if (this.nodeManager) {
                this.nodeManager.updateAllBeams(0);
                this.nodeManager.updateCenterOfGravity();
            }
        });
    }
    //#endregion

    /**
     * Update the world scale
     * @param {number} size - The world size
     * @param {string} unit - The unit of measurement
     */
    updateWorldScale(size, unit) {
        if (this.worldScaleManager) {
            this.worldScaleManager.updateWorldScale(size, unit);
        }
    }

    /**
     * Run physics analysis on the system
     */
    runAnalysis() {
        if (!this.nodeManager) return;

        // Check if system is in equilibrium
        const equilibriumResult = this.nodeManager.checkEquilibrium();

        // Calculate missing forces if not in equilibrium
        let missingForcesResult = null;
        if (!equilibriumResult.isEquilibrium) {
            missingForcesResult = this.nodeManager.calculateMissingForces();
        }

        // Create or update analysis panel
        this.showAnalysisResults(equilibriumResult, missingForcesResult);
    }

    /**
     * Show analysis results in a panel
     * @param {Object} equilibriumResult - Result of equilibrium check
     * @param {Object} missingForcesResult - Result of missing forces calculation
     */
    showAnalysisResults(equilibriumResult, missingForcesResult) {
        // Create panel if it doesn't exist
        if (!this.analysisPanel) {
            this.analysisPanel = document.createElement('div');
            this.analysisPanel.className = 'analysis-panel';
            document.body.appendChild(this.analysisPanel);

            // Add close button
            const closeButton = document.createElement('button');
            closeButton.className = 'analysis-panel-close';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => {
                this.analysisPanel.style.display = 'none';
            });
            this.analysisPanel.appendChild(closeButton);
        }

        // Create content
        let content = `
            <div class="analysis-panel-title">System Analysis Results</div>
            <div class="analysis-panel-section">
                <div class="analysis-panel-section-title">Equilibrium Check</div>
                <div class="analysis-panel-result ${equilibriumResult.isEquilibrium ? 'success' : 'warning'}">
                    System ${equilibriumResult.isEquilibrium ? 'IS' : 'IS NOT'} in equilibrium
                </div>
                <div class="analysis-panel-details">
                    <div>Net Force: (${equilibriumResult.netForce.x.toFixed(2)}, ${equilibriumResult.netForce.y.toFixed(2)}, ${equilibriumResult.netForce.z.toFixed(2)}) N</div>
                    <div>Net Moment: (${equilibriumResult.netMoment.x.toFixed(2)}, ${equilibriumResult.netMoment.y.toFixed(2)}, ${equilibriumResult.netMoment.z.toFixed(2)}) N·m</div>
                </div>
                ${equilibriumResult.formula}
            </div>
        `;

        // Add missing forces section if available
        if (missingForcesResult) {
            content += `
                <div class="analysis-panel-section">
                    <div class="analysis-panel-section-title">Reaction Forces</div>
                    ${missingForcesResult.success ? `
                        <div class="analysis-panel-result success">
                            Reaction forces calculated and applied to ${missingForcesResult.fixedNodes.length} fixed node(s)
                        </div>
                        <div class="analysis-panel-details">
                            <div>Total Reaction Force: (${missingForcesResult.reactionForce.x.toFixed(2)}, ${missingForcesResult.reactionForce.y.toFixed(2)}, ${missingForcesResult.reactionForce.z.toFixed(2)}) N</div>
                            <div>Force per Fixed Node: (${missingForcesResult.reactionPerNode.x.toFixed(2)}, ${missingForcesResult.reactionPerNode.y.toFixed(2)}, ${missingForcesResult.reactionPerNode.z.toFixed(2)}) N</div>
                        </div>
                        ${missingForcesResult.formula}
                    ` : `
                        <div class="analysis-panel-result warning">
                            ${missingForcesResult.message}
                        </div>
                    `}
                </div>
            `;
        }

        // Add center of gravity section
        const cogResult = this.nodeManager.physicsEngine.calculateCenterOfGravity();
        content += `
            <div class="analysis-panel-section">
                <div class="analysis-panel-section-title">Center of Gravity</div>
                <div class="analysis-panel-details">
                    <div>Position: (${cogResult.position.x.toFixed(2)}, ${cogResult.position.y.toFixed(2)}, ${cogResult.position.z.toFixed(2)})</div>
                    <div>Total Mass: ${cogResult.totalMass.toFixed(2)} kg</div>
                </div>
                ${cogResult.formula}
            </div>
        `;

        // Add beam forces section
        const beamForces = this.nodeManager.physicsEngine.calculateBeamForces();
        if (beamForces.length > 0) {
            content += `
                <div class="analysis-panel-section">
                    <div class="analysis-panel-section-title">Beam Forces</div>
                    <div class="analysis-panel-details">
                        <table class="beam-forces-table">
                            <thead>
                                <tr>
                                    <th>Beam</th>
                                    <th>Type</th>
                                    <th>Force (N)</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            beamForces.forEach((beamForce, index) => {
                content += `
                    <tr>
                        <td>Beam ${index + 1}</td>
                        <td>${beamForce.forceType}</td>
                        <td>${beamForce.forceValue.toFixed(2)}</td>
                    </tr>
                `;
            });

            content += `
                            </tbody>
                        </table>
                    </div>
                    ${beamForces[0].formula}
                </div>
            `;
        }

        // Update panel content
        this.analysisPanel.innerHTML = content;

        // Show panel
        this.analysisPanel.style.display = 'block';
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Updates the world, including the camera and controls.
     * @param {number} deltaTime - The time elapsed since the last update.
     */
    updateAll(deltaTime) {
        this.controls.update();
        this.transformControls.controls.update();

        if (this.nodeManager) {
            this.nodeManager.updateAllNodes(deltaTime);
            this.nodeManager.updateAllBeams(deltaTime);
        }

        if (this.worldScaleManager) {
            this.worldScaleManager.updateLabelPositions(this.camera);
        }
    }

    delete() {
        if (this.nodeManager) {
            this.nodeManager.delete();
        }

        if (this.worldScaleManager) {
            // Remove scale markers
            this.worldScaleManager.scaleMarkers.forEach(marker => {
                this.scene.remove(marker);
            });

            // Remove scale labels
            this.worldScaleManager.scaleLabels.forEach(label => {
                if (label.element && label.element.parentNode) {
                    label.element.parentNode.removeChild(label.element);
                }
            });
        }

        this.scene.remove(this.worldCubeGroup);
        this.scene.remove(this.gridHelper);
        this.scene.remove(this.ambientLight);
        this.scene.remove(this.directionalLight);
        this.scene.remove(this.fillLight);
        this.renderer.dispose();
        this.renderer.domElement.remove();
        this.renderer.forceContextLoss();
        this.renderer.context = null;
        this.renderer = null;
        this.camera = null;
        this.controls.dispose();
        this.controls = null;
        this.transformControls.controls.dispose();
        this.transformControls.controls = null;
        this.transformControls = null;
        this.worldCubeGroup = null;
        this.gridHelper = null;
        this.ambientLight = null;
        this.directionalLight = null;
        this.fillLight = null;
        this.nodeManager = null;
        this.worldScaleManager = null;
        this.scene = null;

        // Remove analysis panel
        if (this.analysisPanel && this.analysisPanel.parentNode) {
            this.analysisPanel.parentNode.removeChild(this.analysisPanel);
            this.analysisPanel = null;
        }
    }
}
