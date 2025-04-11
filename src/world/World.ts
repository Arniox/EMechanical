// src/world/World.ts
import * as THREE from "three";
import { EngineeringManager } from '../models/EngineeringManager';
import { Node } from "../models/Node";
import EventEmitter from "eventemitter3";

export class World extends EventEmitter {
    public scene: THREE.Scene | null = null;
    public worldBoxScale: number;
    public engineeringManager: EngineeringManager | null = null;
    public ambientLight: THREE.AmbientLight | null = null;
    public directionalLight: THREE.DirectionalLight | null = null;
    public fillLight: THREE.DirectionalLight | null = null;
    public worldCubeGroup: THREE.Group | null = null;
    public gridHelper: THREE.GridHelper | null = null;
    public camera: THREE.PerspectiveCamera | null = null;;
    public renderer: THREE.WebGLRenderer | null = null;

    constructor(container: HTMLCanvasElement) {
    super();
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); // Dark Gray
        this.worldBoxScale = 2.0;

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
        this.addRenderer(container as HTMLCanvasElement);

        // Event Listeners
        if (this.renderer) {
            this.renderer.domElement.addEventListener("click", this.mouseClickEventHandler.bind(this));
        }

    }

    private mouseClickEventHandler(event: MouseEvent): void {
        console.log("Mouse Click Event Handler");
        // TODO: Implement mouse click handling logic here.
    }


    //#region Initialization
    private addAmbientLight(): void {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        if (this.scene && this.ambientLight) {
            this.scene.add(this.ambientLight);
        }
    }

    private addDirectionalLight(): void {
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        if (this.directionalLight) {
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
            this.scene?.add(this.directionalLight);
        }
    }

    private addFillLight(): void {
        this.fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        if (this.fillLight) this.fillLight.position.set(-5, 2, -7.5);
        if (this.scene && this.fillLight) {
            this.scene.add(this.fillLight);
        }
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
        if (this.scene && this.worldCubeGroup){
            this.scene.add(this.worldCubeGroup);

        }
    }

    private addWorldGrid(): void {
        const gridSize: number =  1 * this.worldBoxScale;
        const gridDivisions: number = ( 1 * 10) * this.worldBoxScale;
        this.gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0x444444);
        if (this.scene && this.gridHelper)
            this.scene.add(this.gridHelper);
    }

    public updateWorldScale(newScale: number): void {
        this.worldBoxScale = newScale;
    
        if (this.worldCubeGroup) {
            // Remove existing cube edges
            this.worldCubeGroup.children = [];
    
            // Recreate cube edges with new scale
            const halfSize: number = 1 / 2;
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
    
            const materialX: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
            const materialY: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            const materialZ: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    
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
        }
    
        if (this.scene && this.gridHelper) {
            this.scene.remove(this.gridHelper); // Remove old grid
            const gridSize: number = 1 * this.worldBoxScale;
            const gridDivisions: number = (1 * 10) * this.worldBoxScale;
            this.gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0x444444);
            this.scene.add(this.gridHelper); // Add new grid
        }
    }

    private addCamera(): void {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        if (this.camera) {
            this.camera.position.set(1.2, 1.2, 2.0);
            this.camera.lookAt(0, 0, 0); // Ensure it looks at the center
        }
    }

    private addRenderer(canvas: HTMLCanvasElement): void {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
    
    }    
    //#endregion
    //#region Event Handlers

    private handleMultiSelectNode(clickedNode: Node): void {
        const selectedNodes = this.engineeringManager?.selectedNodes;

        if (selectedNodes?.length === 0 || selectedNodes?.length === 1) {
            // clickedNode.select(this.transformControls, true);
            this.infoPanelText(selectedNodes.length === 0 ? "Select an end node (Ctrl-click)" : "Connection established");
        } else if (selectedNodes?.length === 2) {
            this.unselectAllNodes();
            // clickedNode.select(this.transformControls, true);
            this.infoPanelText('Select an end node (Ctrl-click)');
        } else {
            this.unselectAllNodes();
            this.infoPanelText("Please Ctrl-click to select exactly 2 nodes to connect.");
        }
    }

    private handleSingleSelectNode(clickedNode: Node): void {
        // this.unselectAllNodes();
        // clickedNode.select(this.transformControls, false);

        if (this.engineeringManager && this.engineeringManager.selectedNodes){
            this.infoPanelText("Selected node for movement");
            this.emit("nodeSelected", clickedNode);
        } else {
            this.infoPanelText("No object selected");
            this.emit("nodeSelected", null);
        }
    }

    private unselectAllNodes(): void {
        // this.engineeringManager.selectedNodes.forEach(node => node.select(this.transformControls, false));
        this.infoPanelText("No object selected");
        this.emit("nodeSelected", null);
    }

    public addNode() {
        const randomPosition = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,(Math.random() - 0.5) * 0.8
        );
        if(this.engineeringManager && this.scene)
            this.engineeringManager.createNode(randomPosition, this.scene);
    }

    public resetCameraView(): void {
        if (this.camera) {
            this.camera.position.set(1.2, 1.2, 1.8);
            this.camera.lookAt(0, 0, 0);
        }
    }

    public deleteSelected(): void {
        // const selectedNode = this.engineeringManager.selectedNode(1);
        // if (selectedNode) {
        //     this.engineeringManager.deleteNode(selectedNode, this.scene);
        //     this.infoPanelText("No object selected");
            this.emit("nodeSelected", null);
    }

    public linkSelected(): void {
        const selectedNodes = this.engineeringManager?.selectedNodes;
        if (selectedNodes?.length === 2) {
            const [node1, node2] = selectedNodes;
            if(this.engineeringManager && this.scene){
            this.engineeringManager.createBeam(node1, node2, this.scene);
            }
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
        if (this.engineeringManager) {
            this.engineeringManager.updateAllNodes(deltaTime);
            this.engineeringManager.updateAllBeams(deltaTime);
        }
    }

    public render(): void {
        if (this.renderer && this.scene && this.camera)
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