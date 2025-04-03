import * as THREE from "three";
import { OrbitControls } from "/three/addons/controls/OrbitControls.js";
import { TransformControls } from "/three/addons/controls/TransformControls.js";
import { NodeManager } from "../models/nodeManager";
import { container } from "../main.js";

export class World {
    constructor() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); // Dark Gray

        // Controls
        this.worldSize = 1.0;
        this.controls = null;
        this.transformControls = {
            controls: null,
            isIntersecting: false,
        };

        // Node Manager
        this.nodeManager = new NodeManager();

        // Lighting
        this.addAmbientLight();
        this.addDirectionalLight();
        this.addFillLight();

        // World Objects
        this.addWorldCube();
        this.addWorldGrid();

        // Rendering and Camera
        this.addCamera();
        this.addRenderer();

        // Controls
        this.addControls();

        // Html Initialization
        this.initializeHTML();
    }

    get isIntersectingTransformControls() {
        return this.transformControls.isIntersecting;
    }
    set isIntersectingTransformControls(value) {
        this.transformControls.isIntersecting = value;
    }

    setWorldSize(size) {
        this.worldSize = size;
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

    addWorldCube() {
        const halfSize = this.worldSize / 2;
        const vertices = [
            new THREE.Vector3(-halfSize, -halfSize, -halfSize),
            new THREE.Vector3(halfSize, -halfSize, -halfSize),
            new THREE.Vector3(halfSize, halfSize, -halfSize),
            new THREE.Vector3(-halfSize, halfSize, -halfSize),
            new THREE.Vector3(-halfSize, -halfSize, halfSize),
            new THREE.Vector3(halfSize, -halfSize, halfSize),
            new THREE.Vector3(halfSize, halfSize, halfSize),
            new THREE.Vector3(-halfSize, halfSize, halfSize)
        ];

        // Create materials for the cube edges.
        // X-axis: red, Y-axis: green, Z-axis: blue
        const materialX = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const materialY = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const materialZ = new THREE.LineBasicMaterial({ color: 0x0000ff });
        this.worldCubeGroup = new THREE.Group();

        // Create edges for the cube.
        this.worldCubeGroup.add(this.createLine(vertices[0], vertices[1], materialX));
        this.worldCubeGroup.add(this.createLine(vertices[3], vertices[2], materialX));
        this.worldCubeGroup.add(this.createLine(vertices[4], vertices[5], materialX));
        this.worldCubeGroup.add(this.createLine(vertices[7], vertices[6], materialX));
        this.worldCubeGroup.add(this.createLine(vertices[0], vertices[3], materialY));
        this.worldCubeGroup.add(this.createLine(vertices[1], vertices[2], materialY));
        this.worldCubeGroup.add(this.createLine(vertices[4], vertices[7], materialY));
        this.worldCubeGroup.add(this.createLine(vertices[5], vertices[6], materialY));
        this.worldCubeGroup.add(this.createLine(vertices[0], vertices[4], materialZ));
        this.worldCubeGroup.add(this.createLine(vertices[1], vertices[5], materialZ));
        this.worldCubeGroup.add(this.createLine(vertices[2], vertices[6], materialZ));
        this.worldCubeGroup.add(this.createLine(vertices[3], vertices[7], materialZ));
        this.scene.add(this.worldCubeGroup);
    }

    addWorldGrid() {
        this.gridHelper = new THREE.GridHelper(1, 10, 0x888888, 0x444444);
        this.scene.add(this.gridHelper);

        // Add event listener to toggle grid visibility
        document.getElementById("showGrid").addEventListener("change", (e) => {
            this.gridHelper.visible = e.target.checked;
        });
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

        // Add event listener for clicking
        this.renderer.domElement.addEventListener("click", this.onMouseClick);
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

        // Add event listener to reset view
        document.getElementById("resetView").addEventListener("click", this.resetView);
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
    }
    //#endregion

    //#region Utility Functions
    /**
     * @param {THREE.Vector3} v1 
     * @param {THREE.Vector3} v2 
     * @param {THREE.LineBasicMaterial} material 
     */
    createLine(v1, v2, material) {
        const geometry = new THREE.BufferGeometry().setFromPoints([v1, v2]);
        return new THREE.Line(geometry, material);
    }

    resetView() {
        this.camera.position.set(1.2, 1.2, 1.8);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    onMouseClick() {

    }
    //#endregion

    //#HTML Initialization
    initializeHTML() {
        document.querySelectorAll('.forceInput').forEach(input => {
            input.setAttribute('max', this.worldSize);
            input.setAttribute('min', -this.worldSize);
        });
    }
    //#endregion

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Updates the world, including the camera and controls.
     */
    async updateAll() {
        this.controls.update();
        this.transformControls.controls.update();
        await this.nodeManager.updateAllNodes();
        await this.nodeManager.updateAllBeams();
    }

    delete() {
        this.nodeManager.delete(this.scene);
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
        this.scene = null;
    }
}