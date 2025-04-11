import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { WorldElement } from './WorldElement';
import Utilities from '../world/Utilities';
import { ForceArrow } from './ForceArrow';

export class Node extends WorldElement {
    public isSelected: boolean;
    public selectedIndex: number;
    public outlineMesh: THREE.Mesh;
    public override force: THREE.Vector3;
    public forceArrow: ForceArrow;

    constructor(position: THREE.Vector3) {
        super();
        this.position = position;
        this.force = new THREE.Vector3(0, 0, 0 );
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

        // Create force arrow
        this.forceArrow = new ForceArrow(this.force, this.position, 0xff0000);
    }

    public override update(deltaTime: number): void {
        // Update the node position based on force
        this.position.add(new THREE.Vector3(this.force.x, this.force.y, this.force.z).multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);

        this.forceArrow.update(this.force, this.position);
    }

    public override add(scene: THREE.Scene): void {
        scene.add(this.mesh);
        this.forceArrow.add(scene);
    }

    public setForce(force: THREE.Vector3): void {
        this.force.copy(force);
    }

    public select(transformControls: TransformControls | null): void {
        this.isSelected = !!transformControls;
        this.outlineMesh.visible = this.isSelected;
        transformControls?.attach(this.mesh);
        if (transformControls) {
            transformControls.addEventListener('change', () => {
                this.position.copy(this.mesh.position);
            });
        }
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
        this.forceArrow.delete(scene);
    }
}