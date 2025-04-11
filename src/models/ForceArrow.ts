import * as THREE from 'three';
import { WorldElement } from './WorldElement';

export class ForceArrow extends WorldElement {
    public arrow: THREE.ArrowHelper;

    constructor(direction: THREE.Vector3, origin: THREE.Vector3, color: number) {
        super();
        this.arrow = new THREE.ArrowHelper(direction.clone().normalize(), origin, 0.2, color, 0.05, 0.03);
    }

    public update(deltaTime: number): void {
        // This method is required by the WorldElement class but not used in ForceArrow
    }

    public setDirection(newDirection: THREE.Vector3, origin: THREE.Vector3): void {
        this.arrow.setDirection(newDirection.clone().normalize());
        this.arrow.position.copy(origin);
    }

    public override add(scene: THREE.Scene): void {
        scene.add(this.arrow);
    }

    public override delete(scene: THREE.Scene): void {
        scene.remove(this.arrow);
    }
}