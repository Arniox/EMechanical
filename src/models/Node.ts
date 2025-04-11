import * as THREE from 'three';
import { WorldElement } from './WorldElement';
import Utilities from '../world/utilities';

export class Node extends WorldElement {
    public isSelected: boolean;
    public selectedIndex: number;
    public outlineMesh: THREE.Mesh;
    public override force: { x: number; y: number; z: number };

    constructor(position: THREE.Vector3) {
        super();
        this.position = position;
        this.force = { x: 0, y: 0, z: 0 };
        this.isSelected = false;
        this.selectedIndex = 0;

        const geometry = new THREE.SphereGeometry(0.1, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.5, metalness: 0.5 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Create outline mesh
        const outlineGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.BackSide });
        this.outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
        this.outlineMesh.scale.set(1.2, 1.2, 1.2); // Slightly larger than the node
        this.outlineMesh.visible = false;
        this.mesh.add(this.outlineMesh); // Add the outline to the node
    }

    public override update(deltaTime: number): void {
        // Update the node position based on force
        this.position.add(new THREE.Vector3(this.force.x, this.force.y, this.force.z).multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
    }

    public select(transformControls: THREE.TransformControls | null, toggle: boolean): void {
        this.isSelected = toggle ? !this.isSelected : true;
        if (this.isSelected) {
            this.selectedIndex = Utilities.keyState.ControlLeft ? 2 : 1;
            this.outlineMesh.visible = true;
            this.mesh.material = new THREE.MeshStandardMaterial({ color: 0xff00ff, roughness: 0.5, metalness: 0.5 });
            if (transformControls && !transformControls.object) {
                transformControls.attach(this.mesh);
            }
        }
        else {
            this.selectedIndex = 0;
            this.outlineMesh.visible = false;
            this.mesh.material = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.5, metalness: 0.5 });
            if (transformControls && transformControls.object) {
                transformControls.detach();
            }
        }
    }

    public override add(scene: THREE.Scene): void {
        scene.add(this.mesh);
    }

    public override delete(scene: THREE.Scene): void {
        // Remove the node mesh and all its children from the scene
        scene.remove(this.mesh);
        this.mesh.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    for (const material of child.material) {
                        material.dispose();
                    }
                } else {
                    child.material.dispose();
                }
            }
        });
        this.mesh.removeFromParent();
    }
}