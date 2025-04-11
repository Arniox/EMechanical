import * as THREE from 'three';

export abstract class WorldElement {
    public position: THREE.Vector3;
    public force: THREE.Vector3;
    public mesh: THREE.Mesh;

    constructor() {
        this.position = new THREE.Vector3();
        this.force = new THREE.Vector3();
        this.mesh = new THREE.Mesh();
    }

    public abstract update(deltaTime: number): void;

    public add(scene: THREE.Scene): void {
        scene.add(this.mesh);
    }

    public delete(scene: THREE.Scene): void {
        scene.remove(this.mesh);
    }
}