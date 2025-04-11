// src/world/World.ts
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { EngineeringManager } from "../models/EngineeringManager";
import { Node } from "../models/Node";
import EventEmitter from "eventemitter3";

export class World extends EventEmitter {
    public scene: THREE.Scene;
    public worldBoxScale: number;
    public controls: OrbitControls;
    public transformControls: TransformControls;
    public engineeringManager: EngineeringManager;
    public ambientLight: THREE.AmbientLight;
    public directionalLight: THREE.DirectionalLight;
    public fillLight: THREE.DirectionalLight;
    public worldCubeGroup: THREE.Group;
    public gridHelper: THREE.GridHelper;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;

    constructor() {\n        super();
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); // Dark Gray
        this.worldBoxScale = 2.0;

        // Controls
        this.controls = null as unknown as OrbitControls;
        this.transformControls = null as unknown as TransformControls;

        // Engineering Manager
        this.engineeringManager = new EngineeringManager();

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
        this.addTransformControls(); // Initialize but don't attach to the scene yet

        // Event Listeners
        this.renderer.domElement.addEventListener("click", this.mouseClickEventHandler.bind(this));
    }

    }

    //#region Initialization
    private addAmbientLight(): void {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
    }

    private addDirectionalLight(): void {
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

    private addFillLight(): void {
        this.fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        this.fillLight.position.set(-5, 2, -7.5);
        this.scene.add(this.fillLight);
    }

    private addWorldCube(): void {
        const halfSize: number =  1 / 2;
        const worldBoxScale: number = halfSize * this.worldBoxScale;
        const vertices: THREE.Vector3[] = [
            new THREE.Vector3(-worldBoxScale, -halfSize, -worldBoxScale),
            new THREE.Vector3(worldBoxScale, -halfSize, -worldBoxScale),
            new THREE.Vector3(worldBoxScale, halfSize, -worldBoxScale),
            new THREE.Vector3(-worldBoxScale, halfSize, -worldBoxScale),
            new THREE.Vector3(-worldBoxScale, -halfSize, worldBoxScale),
            new THREE.Vector3(worldBoxScale, -halfSize, worldBoxScale),
            new THREE.Vector3(worldBoxScale, halfSize, worldBoxScale),
            new THREE.Vector3(-worldBoxScale, halfSize, worldBoxScale)
        ];

        // Create materials for the cube edges.
        // X-axis: red, Y-axis: green, Z-axis: blue
        const materialX: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const materialY: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const materialZ: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
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
        this.worldCubeGroup.add(this.createLine(vertices[0], vertices[4], materialZ)); //e
        this.worldCubeGroup.add(this.createLine(vertices[1], vertices[5], materialZ));
        this.worldCubeGroup.add(this.createLine(vertices[2], vertices[6], materialZ));
        this.worldCubeGroup.add(this.createLine(vertices[3], vertices[7], materialZ));
        this.scene.add(this.worldCubeGroup);
    }

    private addWorldGrid(): void {
        const gridSize: number =  1 * this.worldBoxScale;
        const gridDivisions: number = ( 1 * 10) * this.worldBoxScale;
        this.gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0x444444);
        this.scene.add(this.gridHelper);
    }

    private addCamera(): void {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(1.2, 1.2, 2.0);
        this.camera.lookAt(0, 0, 0); // Ensure it looks at the center
    }

    private addRenderer(): void {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight); // Use window dimensions
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
    }

    private addControls(): void {
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

    private addTransformControls(): void {
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.scene.add(this.transformControls); // Attach to the scene here
        this.transformControls.setMode("translate");
        this.transformControls.setSize(0.5); // Increase gizmo size so it's more visible

        // Add event listeners for transform controls
        this.transformControls.addEventListener("mouseDown", () => {
            this.controls.enabled = false;
        });
        this.transformControls.addEventListener("mouseUp", () => {
            this.controls.enabled = true;
        });
    }
    //#endregion

    //#region Event Handlers
    public mouseClickEventHandler(event: MouseEvent): void {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const intersections = raycaster.intersectObjects(this.engineeringManager.nodeMeshes);

        if (intersections.length > 0) {
            const intersectedNodeMesh = intersections[0].object;
            const clickedNode = this.engineeringManager.nodes.find(node => node.mesh === intersectedNodeMesh);

            if (clickedNode) {
                if (Utilities.keyState.ControlLeft) {
                    this.handleMultiSelectNode(clickedNode);
                } else {
                    this.handleSingleSelectNode(clickedNode);
                }
            }
        } else {
            this.unselectAllNodes();
        }
    }

    private handleMultiSelectNode(clickedNode: Node): void {
        const selectedNodes = this.engineeringManager.selectedNodes;

        if (selectedNodes.length === 0 || selectedNodes.length === 1) {
            clickedNode.select(this.transformControls, true);
            this.infoPanelText(selectedNodes.length === 0 ? "Select an end node (Ctrl-click)" : "Connection established");
        } else if (selectedNodes.length === 2) {
            this.unselectAllNodes();
            clickedNode.select(this.transformControls, true);
            this.infoPanelText("Select an end node (Ctrl-click)");
        } else {
            this.unselectAllNodes();
            this.infoPanelText("Please Ctrl-click to select exactly 2 nodes to connect.");
        }
    }

    private handleSingleSelectNode(clickedNode: Node): void {
        this.unselectAllNodes();
        clickedNode.select(this.transformControls, false);

        if (this.engineeringManager.selectedNodes.length === 1) {
            this.infoPanelText("Selected node for movement");
            this.emit("nodeSelected", clickedNode);
        } else {
            this.infoPanelText("No object selected");
            this.emit("nodeSelected", null);
        }
    }

    private unselectAllNodes(): void {
        this.engineeringManager.selectedNodes.forEach(node => node.select(this.transformControls, false));
        this.infoPanelText("No object selected");
        this.emit("nodeSelected", null);
    }

    public addNode(): void {
        const randomPosition = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8
        );
        this.engineeringManager.createNode(randomPosition, this.scene);
    }

    public resetCameraView(): void {
        this.camera.position.set(1.2, 1.2, 1.8);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    public deleteSelected(): void {
        const selectedNode = this.engineeringManager.selectedNode(1);
        if (selectedNode) {
            this.engineeringManager.deleteNode(selectedNode, this.scene);
            this.infoPanelText("No object selected");
            this.emit("nodeSelected", null);
        }
    }

    public linkSelected(): void {
        const selectedNodes = this.engineeringManager.selectedNodes;
        if (selectedNodes.length === 2) {
            const [node1, node2] = selectedNodes;
            this.engineeringManager.createBeam(node1, node2, this.scene);
            this.infoPanelText("Connected nodes");
        } else {
            this.infoPanelText("Please Ctrl-click to select exactly 2 nodes to connect.");
        }
    }
    //#endregion

    //#region UI Management
    public infoPanelText(text: string): void {
        this.emit("infoPanelTextChanged", text);
    }
    //#endregion

    //#region Animation and Update
    /**
     * Updates the world, including the camera and controls.
     * @param {number} deltaTime - The time elapsed since the last update.
     */
    public updateAll(deltaTime: number): void {
        this.controls.update();
        this.transformControls.update();
        this.engineeringManager.updateAllNodes(deltaTime);
        this.engineeringManager.updateAllBeams(deltaTime);
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
    //#endregion

    //#region Utility Functions
    private createLine(v1: THREE.Vector3, v2: THREE.Vector3, material: THREE.LineBasicMaterial): THREE.Line {
        const geometry: THREE.BufferGeometry = new THREE.BufferGeometry().setFromPoints([v1, v2]);
        return new THREE.Line(geometry, material);
    }
    //#endregion
}